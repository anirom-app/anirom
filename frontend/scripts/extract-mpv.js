const path = require('path');
const fs = require('fs');
const sevenBin = require('7zip-bin');
const { extractFull } = require('node-7z');

const zipPath = path.join(__dirname, '../bin/mpv.zip');
const destPath = path.join(__dirname, '../bin/mpv');

if (fs.existsSync(path.join(destPath, 'mpv.exe'))) {
    console.log('mpv.exe already exists, skipping extraction.');
    process.exit(0);
}

if (!fs.existsSync(zipPath)) {
    console.error('mpv.zip not found! Skipping extraction.');
    process.exit(0);
}

console.log('Extracting MPV video player...');

const stream = extractFull(zipPath, destPath, {
    $bin: sevenBin.path7za
});

stream.on('end', () => {
    console.log('MPV extracted successfully!');
});

stream.on('error', (err) => {
    console.error('Error extracting MPV:', err);
});
