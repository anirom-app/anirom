import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';

const CACHE_DIR = path.join(app.getPath('userData'), 'media_cache');
const MAX_CACHE_SIZE = 300 * 1024 * 1024; // 300 MB

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getHash(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

/**
 * Returns the local file path for a given media URL.
 * If not cached, downloads it, optimizes it (if image), and saves it.
 */
export async function getOrDownloadMedia(url: string): Promise<string> {
  const urlWithoutParams = url.split('?')[0];
  const isVideo = urlWithoutParams.endsWith('.webm') || urlWithoutParams.endsWith('.mp4');
  const extension = isVideo ? urlWithoutParams.split('.').pop() : 'webp';
  const hash = getHash(url);
  const fileName = `${hash}.${extension}`;
  const filePath = path.join(CACHE_DIR, fileName);

  // If exists, update access time and return
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const now = new Date();
    
    // For videos, delete if older than 24 hours
    if (isVideo) {
      const ageInMs = now.getTime() - stats.mtimeMs;
      if (ageInMs > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        // Continue to download again
      } else {
        fs.utimesSync(filePath, now, stats.mtime); // Update atime for LRU, preserve mtime
        return filePath;
      }
    } else {
      fs.utimesSync(filePath, now, stats.mtime); // Update atime for LRU, preserve mtime
      return filePath;
    }
  }

  // Download
  if (isVideo) {
    // Download video asynchronously to a temporary file and return "" immediately
    const tmpFilePath = filePath + '.tmp';
    axios.get(url, { responseType: 'stream', timeout: 30000 }).then(response => {
      const writer = fs.createWriteStream(tmpFilePath);
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        try {
          fs.renameSync(tmpFilePath, filePath);
        } catch (renameErr) {
          console.error(`[MediaCache] Error renaming tmp file for ${url}:`, renameErr);
        }
      });
      
      writer.on('error', (err) => {
        console.error(`[MediaCache] Writer error for ${url}:`, err);
        if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
      });

    }).catch(err => {
      console.error(`[MediaCache] Async download failed for ${url}:`, err.message);
      if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
    });
    return ""; // Empty string indicates it's downloading in background
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(response.data);

    // Optimize image to WebP
    await sharp(buffer)
      .webp({ quality: 80 })
      .toFile(filePath);

    return filePath;
  } catch (error) {
    console.error(`Error downloading media from ${url}:`, error);
    throw error;
  }
}

/**
 * Enforces the 300MB cache limit using an LRU (Least Recently Used) strategy.
 */
export async function enforceCacheLimit() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    const fileStats = files.map(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      return { filePath, size: stats.size, atime: stats.atimeMs };
    });

    if (totalSize > MAX_CACHE_SIZE) {
      // Sort by oldest access time first
      fileStats.sort((a, b) => a.atime - b.atime);

      let targetSize = 250 * 1024 * 1024; // Reduce to 250MB
      let currentSize = totalSize;

      for (const file of fileStats) {
        if (currentSize <= targetSize) break;
        try {
          fs.unlinkSync(file.filePath);
          currentSize -= file.size;
          console.log(`[MediaCache] Deleted ${file.filePath} to free space.`);
        } catch (err) {
          console.error(`[MediaCache] Failed to delete ${file.filePath}`, err);
        }
      }
    }
  } catch (error) {
    console.error('[MediaCache] Error enforcing cache limit:', error);
  }
}
