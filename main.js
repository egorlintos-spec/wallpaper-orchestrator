// main.js — Electron main process
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const pack = require('./core/pack_manager');
const config = require('./config');

let win, lastPack = null; // remembers the most recent built pack for "delete"

function createWindow() {
  win = new BrowserWindow({
    width: 1040, height: 720, minWidth: 880, minHeight: 600,
    backgroundColor: '#202020', title: 'Wallpaper Orchestrator',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'gui', 'index.html'));
}
const send = (ch, msg) => { if (win && !win.isDestroyed()) win.webContents.send(ch, msg); };
const status = (m) => send('status', m);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// --- IPC ---

// Scan only (preview what would be uploaded)
ipcMain.handle('scan', async () => {
  const items = pack.scan();
  const byCat = {};
  for (const it of items) byCat[it.category] = (byCat[it.category] || 0) + 1;
  return { root: pack.resolveWatchRoot(), total: items.length, byCat,
    files: items.map(i => ({ name: i.name, category: i.category })) };
});

// Build pack: upload to GitHub + write CSV. Remembers it for delete.
ipcMain.handle('buildPack', async () => {
  try {
    const result = await pack.buildPack(status);
    lastPack = { manifestPath: result.manifestPath, csvPath: result.csvPath, count: result.count };
    return { ok: true, ...result };
  } catch (e) { status('❌ ' + e.message); return { ok: false, error: e.message }; }
});

// Open the CSV in the default app (Excel etc.) + reveal in folder
ipcMain.handle('openCsv', async (_e, csvPath) => {
  const p = csvPath || (lastPack && lastPack.csvPath);
  if (!p || !fs.existsSync(p)) return { ok: false, error: 'CSV not found' };
  shell.showItemInFolder(p);
  return { ok: true, path: p };
});

// Delete the last built pack from GitHub (call AFTER Pinterest import succeeds).
ipcMain.handle('deletePack', async (_e, opts) => {
  try {
    if (!lastPack || !fs.existsSync(lastPack.manifestPath))
      return { ok: false, error: 'No pack to delete (build one first).' };
    const res = await pack.deletePack(lastPack.manifestPath, opts || {}, status);
    lastPack = null;
    return { ok: true, ...res };
  } catch (e) { status('❌ ' + e.message); return { ok: false, error: e.message }; }
});

ipcMain.handle('hasPack', async () => ({ has: !!(lastPack && fs.existsSync(lastPack.manifestPath)), csvPath: lastPack && lastPack.csvPath }));
ipcMain.handle('openWatchRoot', async () => { const r = pack.resolveWatchRoot(); fs.mkdirSync(r, { recursive: true }); shell.openPath(r); return { ok: true, root: r }; });
