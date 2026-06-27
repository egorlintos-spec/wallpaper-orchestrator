// preload.js — secure IPC bridge
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  scan:          ()      => ipcRenderer.invoke('scan'),
  buildPack:     ()      => ipcRenderer.invoke('buildPack'),
  openCsv:       (p)     => ipcRenderer.invoke('openCsv', p),
  deletePack:    (opts)  => ipcRenderer.invoke('deletePack', opts),
  hasPack:       ()      => ipcRenderer.invoke('hasPack'),
  openWatchRoot: ()      => ipcRenderer.invoke('openWatchRoot'),
  onStatus:      (cb)    => ipcRenderer.on('status', (_e, m) => cb(m)),
});
