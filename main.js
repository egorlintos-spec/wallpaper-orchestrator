// main.js — Electron main process
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
require('dotenv').config();
const config = require('./config');
const watcher = require('./core/watcher');

let win = null;
let stopFn = null;

function createWindow() {
  win = new BrowserWindow({
    width: 880, height: 640,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, 'gui', 'index.html'));
}

function send(msg) { if (win && !win.isDestroyed()) win.webContents.send('status', msg); }

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (stopFn) stopFn(); if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('watch:start', async () => {
  if (stopFn) return { ok: true, already: true };
  send('▶️ Starting watcher…');
  stopFn = await watcher.start(send);
  return { ok: true };
});

ipcMain.handle('watch:stop', async () => {
  if (stopFn) { stopFn(); stopFn = null; send('⏹️ Watcher stopped.'); }
  return { ok: true };
});

ipcMain.handle('watch:scan', async () => {
  const ledger = watcher.loadLedger();
  const pending = watcher.scan(ledger);
  send('🔍 Scan: ' + pending.length + ' image(s) pending across categories.');
  return { pending: pending.map(p => ({ file: path.basename(p.imagePath), category: p.category })) };
});

ipcMain.handle('open:watchRoot', async () => { await shell.openPath(config.watchRoot); return { ok: true }; });

ipcMain.handle('get:config', async () => ({
  watchRoot: config.watchRoot,
  categories: Object.keys(config.categories),
  postMode: config.postMode,
  postsPerDay: config.postsPerDay,
}));
