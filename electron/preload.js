const { contextBridge, ipcRenderer, shell } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onMessage: (callback) => ipcRenderer.on('message', callback),
  openExternal: (url) => shell.openExternal(url),

  startDownload: (url, savePath) => ipcRenderer.send('start-download', { url, savePath }),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
  onDownloadError: (callback) => ipcRenderer.on('download-error', callback)
});
