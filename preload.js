// preload.js — secure IPC bridge
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  startWatch: () => ipcRenderer.invoke('watch:start'),
  stopWatch:  () => ipcRenderer.invoke('watch:stop'),
  scan:       () => ipcRenderer.invoke('watch:scan'),
  openFolder: () => ipcRenderer.invoke('open:watchRoot'),
  getConfig:  () => ipcRenderer.invoke('get:config'),
  onStatus:   (cb) => ipcRenderer.on('status', (_e, msg) => cb(msg)),
});
