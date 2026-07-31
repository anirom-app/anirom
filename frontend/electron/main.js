const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');

let mainWindow;
let goEngineProcess = null;

async function fetchAniSkip(animeTitle, episodeNumber, ipcSocketPath) {
  if (!animeTitle || !episodeNumber) return;
  try {
    console.log(`[AniSkip] Buscando MAL ID para: ${animeTitle}`);
    const anilistQuery = {
      query: "query ($search: String) { Media(search: $search, type: ANIME) { idMal } }",
      variables: { search: animeTitle }
    };
    
    // In node 18+, fetch is available globally. If not, this might fail, but modern electron has it.
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
    
    const op = aniskipData.results.find(r => r.skipType === 'op');
    if (!op) return console.log("[AniSkip] Nenhuma abertura encontrada");
    
    const startTime = op.interval.startTime;
    const endTime = op.interval.endTime;
    console.log(`[AniSkip] Abertura encontrada: ${startTime} - ${endTime}`);
    
    const payload = JSON.stringify({ "command": ["script-message", "aniskip", startTime.toString(), endTime.toString()] }) + "\n";
    
    function connectWithRetry(retries = 10, delay = 500) {
      const client = net.connect(ipcSocketPath, () => {
        client.write(payload);
        client.end();
        console.log("[AniSkip] Comando IPC enviado para o MPV!");
      });
      client.on('error', (err) => {
        if (retries > 0) {
          console.log(`[AniSkip] Erro IPC (Socket): ${err.message}. Tentando novamente em ${delay}ms...`);
          setTimeout(() => connectWithRetry(retries - 1, delay), delay);
        } else {
          console.log("[AniSkip] Falha final IPC (Socket):", err.message);
        }
      });
    }
    
    connectWithRetry();
    
  } catch (err) {
    console.log("[AniSkip] Erro interno:", err.message);
  }
}


function clearTorrentCacheSync() {
  const dataDir = path.join(os.tmpdir(), "anirom_torrents");
  try {
    if (fs.existsSync(dataDir)) {
      console.log("[Electron] Limpando cache de torrents em:", dataDir);
      fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
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
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Em modo de desenvolvimento, carrega o Next.js local na porta 3000
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.handle('play-video', async (event, payload) => {
    let rawUrl, title, tmdbId, animeTitle, episodeNumber;
    if (typeof payload === 'string') {
      rawUrl = payload;
      title = 'Anirom Video';
    } else {
      rawUrl = payload.url;
      title = payload.title;
      tmdbId = payload.tmdbId;
      animeTitle = payload.animeTitle;
      episodeNumber = payload.episodeNumber;
    }
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
    
    const ipcSocketPath = process.platform === 'win32' 
      ? '\\\\.\\pipe\\anirom-mpv-ipc-' + Date.now()
      : path.join(os.tmpdir(), 'anirom-mpv-ipc-' + Date.now() + '.sock');

    try {
      const mpvArgs = [
        url,
        `--input-ipc-server=${ipcSocketPath}`,
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
        console.log(`[MPV] Fechado com código ${code}. Solicitando parada do torrent...`);
        
        fetch("http://localhost:8080/api/stop").catch(e => console.error("Falha ao parar torrent:", e));

        setTimeout(() => {
          clearTorrentCacheSync();
        }, 1000);

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('player-closed');
        }
      });
      
      // Call AniSkip async, don't await so MPV starts immediately
      fetchAniSkip(animeTitle, episodeNumber, ipcSocketPath);
      
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
