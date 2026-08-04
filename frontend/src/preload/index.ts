import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeElectronTRPC } from 'electron-trpc/main'

process.once('loaded', async () => {
  exposeElectronTRPC()
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    
    // Custom APIs for renderer
    contextBridge.exposeInMainWorld('api', {
      onPlayerClosed: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('player-closed', subscription);
        return () => ipcRenderer.removeListener('player-closed', subscription);
      },
      playVideo: (payload: any) => {
        return ipcRenderer.invoke('play-video', payload);
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
