const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let goEngineProcess = null;

function clearTorrentCacheSync() {
  const dataDir = path.join(os.tmpdir(), "anirom_torrents");
  try {
    if (fs.existsSync(dataDir)) {
      console.log("[Electron] Limpando cache de torrents em:", dataDir);
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("[Electron] Falha ao limpar cache de torrents:", err);
  }
}

function startGoEngine() {
  const isDev = process.env.NODE_ENV === 'development';
  let enginePath;
  
  if (isDev) {
    enginePath = path.join(__dirname, '../bin/go-engine.exe');
  } else {
    enginePath = path.join(process.resourcesPath, 'bin/go-engine.exe');
  }

  console.log(`[Go Engine] Iniciando a partir de: ${enginePath}`);
  
  try {
    goEngineProcess = spawn(enginePath, []);

    goEngineProcess.stdout.on('data', (data) => {
      console.log(`[Go Engine]: ${data}`);
    });

    goEngineProcess.stderr.on('data', (data) => {
      console.error(`[Go Engine Error]: ${data}`);
    });
  } catch (err) {
    console.error("Falha ao iniciar Go Engine:", err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Anirom",
    icon: path.join(__dirname, '../build/anirom-icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Em modo de desenvolvimento, carrega o Next.js local na porta 3000
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.handle('play-video', async (event, payload) => {
    const { url: rawUrl, title } = typeof payload === 'string' ? { url: payload, title: 'Anirom Video' } : payload;
    const url = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || JSON.stringify(rawUrl));
    const isDev = process.env.NODE_ENV === 'development';
    let mpvPath;
    let scriptPath;
    
    if (isDev) {
      mpvPath = path.join(__dirname, '../bin/mpv/mpv.exe');
      scriptPath = path.join(__dirname, '../bin/mpv/scripts/anirom_osc.lua');
    } else {
      mpvPath = path.join(process.resourcesPath, 'bin/mpv/mpv.exe');
      scriptPath = path.join(process.resourcesPath, 'bin/mpv/scripts/anirom_osc.lua');
    }

    console.log(`[MPV] Inciando MPV com a URL: ${url}`);
    
    try {
      const mpvArgs = [
        url,
        `--force-media-title=${title}`,
        '--alang=por,pt,pt-BR,pt-br,en,eng,jpn,ja',
        '--slang=por,pt,pt-BR,pt-br,en,eng',
        '--osc=no',
        `--script=${scriptPath}`,
        '--force-window=immediate',
        '--keep-open=yes',
        '--ontop',
        '--network-timeout=300',
        '--stream-lavf-o=reconnect=1,reconnect_delay_max=30',
        '--cache=yes',
        '--cache-pause=yes',
        '--cache-secs=15',
        '--demuxer-max-bytes=128M',
        '--demuxer-readahead-secs=15'
      ];
      
      const mpvProcess = spawn(mpvPath, mpvArgs);

      mpvProcess.on('error', (err) => {
        console.error("Falha ao iniciar MPV:", err);
      });
      
      mpvProcess.on('close', (code) => {
        console.log(`[MPV] Fechado com código ${code}. Reiniciando Go Engine para limpar downloads...`);
        if (goEngineProcess) {
          const oldProcess = goEngineProcess;
          goEngineProcess = null;
          
          oldProcess.on('exit', () => {
            console.log("[Go Engine] Processo anterior encerrado. Limpando cache e iniciando novo...");
            clearTorrentCacheSync();
            startGoEngine();
          });
          oldProcess.kill();
        } else {
          clearTorrentCacheSync();
          startGoEngine();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('player-closed');
        }
      });
      
      return true;
    } catch (e) {
      console.error("Exceção ao iniciar MPV", e);
      return false;
    }
  });
}

app.on('ready', () => {
  startGoEngine();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (goEngineProcess) {
    console.log("Encerrando o Go Engine...");
    goEngineProcess.kill();
  }
});
