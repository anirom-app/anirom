const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const sevenBin = require('7zip-bin');
const Seven = require('node-7z');

const binDir = path.join(__dirname, 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir);
}

https.get('https://api.github.com/repos/shinchiro/mpv-winbuild-cmake/releases/latest', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    const asset = json.assets.find(a => a.name.startsWith('mpv-x86_64-v3') && a.name.endsWith('.7z'));
    
    if (asset) {
      console.log(`Baixando: ${asset.browser_download_url}`);
      execSync(`curl -L -o bin/mpv.7z "${asset.browser_download_url}"`, { stdio: 'inherit' });
      
      console.log("Extraindo MPV (pode demorar)...");
      const extractStream = Seven.extractFull('bin/mpv.7z', 'bin/mpv', {
        $bin: sevenBin.path7za
      });

      extractStream.on('end', () => {
        console.log("Extração concluída!");
        fs.unlinkSync(path.join(__dirname, 'bin/mpv.7z'));
        console.log("MPV pronto em bin/mpv");
      });

      extractStream.on('error', (err) => {
        console.error("Erro na extração", err);
      });
      
    } else {
      console.error("Asset não encontrado.");
    }
  });
});
