import 'dotenv/config';
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import { createIPCHandler } from 'electron-trpc/main'
import { appRouter } from './routers/_app'
import { protocol, net } from 'electron'
import netNode from 'net'
import { initCacheDb } from './db/cacheDb'

async function fetchAniSkip(animeTitle: string, episodeNumber: string | number, ipcSocketPath: string) {
  if (!animeTitle || !episodeNumber) return;
  try {
    console.log(`[AniSkip] Buscando MAL ID para: ${animeTitle}`);
    const anilistQuery = {
      query: "query ($search: String) { Media(search: $search, type: ANIME) { idMal } }",
      variables: { search: animeTitle }
    };
    
    const anilistRes = await fetch("https://graphql.anilist.co", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anilistQuery)
    });
    
    if (!anilistRes.ok) return console.log("[AniSkip] Falha ao consultar AniList");
    const anilistData = await anilistRes.json();
    const malId = anilistData?.data?.Media?.idMal;
    
    if (!malId) return console.log("[AniSkip] MAL ID não encontrado para o anime");
    
    console.log(`[AniSkip] MAL ID encontrado: ${malId}. Buscando tempos de skip...`);
    const aniskipRes = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&episodeLength=0`);
    if (!aniskipRes.ok) return console.log("[AniSkip] Falha ao consultar AniSkip API");
    
    const aniskipData = await aniskipRes.json();
    if (!aniskipData.found) return console.log("[AniSkip] Nenhum skip time encontrado");
    
    const op = aniskipData.results.find((r: any) => r.skipType === 'op');
    if (!op) return console.log("[AniSkip] Nenhuma abertura encontrada");
    
    const startTime = op.interval.startTime;
    const endTime = op.interval.endTime;
    console.log(`[AniSkip] Abertura encontrada: ${startTime} - ${endTime}`);
    
    const payload = JSON.stringify({ "command": ["script-message", "aniskip", startTime.toString(), endTime.toString()] }) + "\n";
    
    function connectWithRetry(retries = 10, delay = 500) {
      const client = netNode.connect(ipcSocketPath, () => {
        client.write(payload);
        client.end();
        console.log("[AniSkip] Comando IPC enviado para o MPV!");
      });
      client.on('error', (err: any) => {
        if (retries > 0) {
          console.log(`[AniSkip] Erro IPC (Socket): ${err.message}. Tentando novamente em ${delay}ms...`);
          setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
          console.log("[AniSkip] Falha final IPC (Socket):", err.message);
        }
      });
    }
    
    connectWithRetry();
    
  } catch (err: any) {
    console.log("[AniSkip] Erro interno:", err.message);
  }
}
import { getOrDownloadMedia, enforceCacheLimit } from './services/MediaCacheManager'

protocol.registerSchemesAsPrivileged([
  { scheme: 'anirom', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } }
])

let mainWindow: BrowserWindow | null = null;
let goEngineProcess: any = null;

function clearTorrentCacheSync() {
  const dataDir = join(os.tmpdir(), "anirom_torrents");
  try {
    if (fs.existsSync(dataDir)) {
      console.log("[Electron] Limpando cache de torrents em:", dataDir);
      fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  } catch (err: any) {
    console.warn(`[Electron] Aviso ao limpar cache de torrents (Inofensivo): ${err.message}`);
  }
}

function startGoEngine() {
  let enginePath;
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    enginePath = join(__dirname, '../../bin/go-engine.exe');
  } else {
    enginePath = join(process.resourcesPath, 'bin/go-engine.exe');
  }

  console.log(`[Go Engine] Iniciando a partir de: ${enginePath}`);
  
  try {
    goEngineProcess = spawn(enginePath, []);

    goEngineProcess.stdout.on('data', (data: any) => {
      console.log(`[Go Engine]: ${data}`);
    });

    goEngineProcess.stderr.on('data', (data: any) => {
      console.error(`[Go Engine Error]: ${data}`);
    });
  } catch (err) {
    console.error("Falha ao iniciar Go Engine:", err);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Anirom",
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../build/anirom-icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // tRPC IPC handler
  createIPCHandler({ router: appRouter, windows: [mainWindow] })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler for play-video (from original code)
ipcMain.handle('play-video', async (_event, payload) => {
  let rawUrl, title, tmdbId, animeTitle, episodeNumber, resumeTime;
  if (typeof payload === 'string') {
    rawUrl = payload;
    title = 'Anirom Video';
  } else {
    rawUrl = payload.url;
    title = payload.title;
    tmdbId = payload.tmdbId;
    animeTitle = payload.animeTitle;
    episodeNumber = payload.episodeNumber;
    resumeTime = payload.resumeTime;
  }
  const url = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || JSON.stringify(rawUrl));
  
  let mpvPath;
  let scriptPath;
  let aniSkipPath;
  
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mpvPath = join(__dirname, '../../bin/mpv/mpv.exe');
    scriptPath = join(__dirname, '../../bin/mpv/scripts/anirom_osc.lua');
    aniSkipPath = join(__dirname, '../../bin/mpv/scripts/aniskip.lua');
  } else {
    mpvPath = join(process.resourcesPath, 'bin/mpv/mpv.exe');
    scriptPath = join(process.resourcesPath, 'bin/mpv/scripts/anirom_osc.lua');
    aniSkipPath = join(process.resourcesPath, 'bin/mpv/scripts/aniskip.lua');
  }

  console.log(`[MPV] Inciando MPV com a URL: ${url}`);
  
  const ipcSocketPath = process.platform === 'win32' 
    ? '\\\\.\\pipe\\anirom-mpv-ipc-' + Date.now()
    : join(os.tmpdir(), 'anirom-mpv-ipc-' + Date.now() + '.sock');

  let targetUrl = url;
  let isLocalFile = false;

  // Verificacao de retencao offline (se o video parcial ja foi salvo)
  if (tmdbId && episodeNumber) {
    const fs = require('fs');
    const saveDir = join(os.tmpdir(), 'anirom_saved_progress');
    const possibleExts = ['.mkv', '.mp4', '.webm', '.avi'];
    for (const ext of possibleExts) {
      const localPath = join(saveDir, `${tmdbId}_${episodeNumber}${ext}`);
      if (fs.existsSync(localPath)) {
        targetUrl = localPath;
        isLocalFile = true;
        console.log(`[MPV] Usando arquivo retido offline: ${localPath}`);
        break;
      }
    }
  }

  if (!isLocalFile && (url.startsWith('http://') || url.startsWith('https://'))) {
    // If it's not a localhost torrent stream, pass through proxy
    if (!url.includes('localhost:8080')) {
      targetUrl = `http://localhost:8080/api/http-proxy?url=${encodeURIComponent(url)}`;
    }
  }

  const cacheDir = join(os.tmpdir(), 'anirom_torrents');
  try {
    if (!require('fs').existsSync(cacheDir)) {
      require('fs').mkdirSync(cacheDir, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create cache directory", e);
  }

  try {
    const mpvArgs = [
      targetUrl,
      `--input-ipc-server=${ipcSocketPath}`,
      `--force-media-title=${title}`,
      '--alang=por,pt,pt-BR,pt-br,en,eng,jpn,ja',
      '--slang=por,pt,pt-BR,pt-br,en,eng',
      '--osc=no',
      `--script=${scriptPath}`,
      `--script=${aniSkipPath}`,
      '--force-window=immediate',
      '--keep-open=yes',
      '--ontop',
      '--network-timeout=300',
      '--stream-lavf-o=reconnect=1,reconnect_delay_max=30',
      '--cache=yes',
      '--cache-on-disk=yes',
      `--demuxer-cache-dir=${cacheDir}`,
      '--demuxer-max-bytes=1500M',
      '--demuxer-readahead-secs=3600',
      `--log-file=${join(os.tmpdir(), 'mpv-crash.log')}`
    ];
    
    if (resumeTime) {
      mpvArgs.push(`--start=${resumeTime}`);
    }
    
    const mpvProcess = spawn(mpvPath, mpvArgs);
    
    let lastTimePos = 0;
    let duration = 0;
    let isCompleted = false;

    mpvProcess.on('error', (err) => {
      console.error("Falha ao iniciar MPV:", err);
    });
    
    mpvProcess.stdout?.on('data', (data) => {
      console.log(`[MPV stdout]: ${data.toString()}`);
    });

    mpvProcess.stderr?.on('data', (data) => {
      console.error(`[MPV stderr]: ${data.toString()}`);
    });
    
    mpvProcess.on('close', (code) => {
      console.log(`[MPV] Fechado com código ${code}. Solicitando parada do torrent...`);
      
      let saveProgress = 'false';
      if (lastTimePos > 0 && duration > 0) {
          const pct = lastTimePos / duration;
          isCompleted = pct >= 0.90;
          if (!isCompleted && !isLocalFile) saveProgress = 'true';
          
          if (mainWindow && !mainWindow.isDestroyed()) {
             mainWindow.webContents.send('sync-history', {
                 animeId: tmdbId,
                 episodeNumber: episodeNumber,
                 timestampMillis: Math.floor(lastTimePos * 1000),
                 durationMillis: Math.floor(duration * 1000),
                 isCompleted
             });
          }
      }
      
      fetch(`http://localhost:8080/api/stop?saveProgress=${saveProgress}&animeId=${tmdbId}&episode=${episodeNumber}`)
        .then(() => console.log("[Go Engine] Torrents parados com sucesso via API."))
        .catch(e => console.error("Falha ao parar torrent via API:", e));

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('player-closed');
      }
    });
    
    // Call AniSkip async, don't await so MPV starts immediately
    if (animeTitle && episodeNumber) {
      console.log(`[Main] Calling AniSkip with title=${animeTitle} episode=${episodeNumber}`);
      fetchAniSkip(animeTitle, episodeNumber, ipcSocketPath);
    }
    
    // IPC Polling properties for History tracking
    setTimeout(() => {
        const client = netNode.connect(ipcSocketPath, () => {
             // Observe time-pos
             client.write(JSON.stringify({ "command": ["observe_property", 1, "time-pos"] }) + "\n");
             // Observe duration
             client.write(JSON.stringify({ "command": ["observe_property", 2, "duration"] }) + "\n");
        });
        
        client.on('data', (data) => {
             const lines = data.toString().split('\n');
             lines.forEach(line => {
                 if (!line.trim()) return;
                 try {
                     const msg = JSON.parse(line);
                     if (msg.event === "property-change") {
                         if (msg.name === "time-pos" && msg.data) lastTimePos = msg.data;
                         if (msg.name === "duration" && msg.data) duration = msg.data;
                     }
                 } catch (e) {}
             });
        });
        
        client.on('error', () => { /* ignore */ });
    }, 2000); // delay to let MPV init the IPC server
    
    return true;
  } catch (e) {
    console.error("Exceção ao iniciar MPV", e);
    return false;
  }
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.anirom.app')

  initCacheDb()
  enforceCacheLimit()

  protocol.handle('anirom', async (request) => {
    try {
      const urlObj = new URL(request.url)
      if (urlObj.hostname === 'media') {
        const targetUrl = urlObj.searchParams.get('url')
        if (targetUrl) {
          const filePath = await getOrDownloadMedia(targetUrl)
          if (filePath === "") {
            return Response.redirect(targetUrl, 302);
          }
          const fileUrl = 'file://' + filePath.replace(/\\/g, '/');
          
          return net.fetch(fileUrl);
        }
      }
    } catch (err) {
      console.error('[Protocol Handler Error]', err)
    }
    return new Response('Not Found', { status: 404 })
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  startGoEngine();
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  if (goEngineProcess) {
    console.log("Encerrando o Go Engine...");
    goEngineProcess.kill();
  }
})
