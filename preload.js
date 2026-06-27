// preload.js — secure bridge
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  runOnce: (opts) => ipcRenderer.invoke('run-once', opts),
  onStatus: (cb) => ipcRenderer.on('status', (_e, line) => cb(line)),
});