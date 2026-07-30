const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  playVideo: (payload) => ipcRenderer.invoke('play-video', payload),
  onPlayerClosed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('player-closed', handler);
    return () => ipcRenderer.removeListener('player-closed', handler);
  }
});
