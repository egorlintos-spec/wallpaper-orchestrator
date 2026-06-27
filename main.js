// main.js — Electron main process
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const pack = require('./core/pack_manager');

let win, lastPack = null;

// --- Settings persistence (userData/settings.json) ---
function settingsPath() { return path.join(app.getPath('userData'), 'settings.json'); }
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')); } catch { return {}; }
}
function saveSettings(s) { fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2), 'utf8'); }
// Push saved settings into the live config object (core modules read config.*).
function applySettings(s) {
  if (s.token)  config.github.token  = s.token;
  if (s.owner)  config.github.owner  = s.owner;
  if (s.repo)   config.github.repo   = s.repo;
  if (s.branch) config.github.branch = s.branch;
  if (s.boosty) config.pinterestLink = s.boosty;
  if (s.watchRoot) config.watchRoot  = s.watchRoot;
}
applySettings(loadSettings());

function createWindow() {
  win = new BrowserWindow({
    width: 1040, height: 760, minWidth: 880, minHeight: 620,
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

// --- Settings IPC ---
ipcMain.handle('getSettings', async () => {
  const s = loadSettings();
  // never send the full token back to the UI — only whether it's set + a masked hint
  const token = s.token || config.github.token || '';
  return {
    hasToken: !!token,
    tokenHint: token ? (token.slice(0, 7) + '…' + token.slice(-4)) : '',
    owner: s.owner || config.github.owner,
    repo: s.repo || config.github.repo,
    branch: s.branch || config.github.branch,
    boosty: s.boosty || config.pinterestLink,
    watchRoot: s.watchRoot || config.watchRoot,
  };
});
ipcMain.handle('saveSettings', async (_e, incoming) => {
  const s = loadSettings();
  // only overwrite token if a new non-empty one was supplied
  if (incoming.token && incoming.token.trim()) s.token = incoming.token.trim();
  if (incoming.owner  !== undefined) s.owner  = incoming.owner;
  if (incoming.repo   !== undefined) s.repo   = incoming.repo;
  if (incoming.branch !== undefined) s.branch = incoming.branch;
  if (incoming.boosty !== undefined) s.boosty = incoming.boosty;
  if (incoming.watchRoot !== undefined) s.watchRoot = incoming.watchRoot;
  saveSettings(s);
  applySettings(s);
  return { ok: true };
});

// --- Pack IPC ---
ipcMain.handle('scan', async () => {
  const items = pack.scan();
  const byCat = {};
  for (const it of items) byCat[it.category] = (byCat[it.category] || 0) + 1;
  return { root: pack.resolveWatchRoot(), total: items.length, byCat };
});
ipcMain.handle('buildPack', async () => {
  try {
    if (!config.github.token) return { ok: false, error: 'No GitHub token. Open Settings and paste your token first.' };
    const result = await pack.buildPack(status);
    lastPack = { manifestPath: result.manifestPath, csvPath: result.csvPath, count: result.count };
    return { ok: true, ...result };
  } catch (e) { status('❌ ' + e.message); return { ok: false, error: e.message }; }
});
ipcMain.handle('openCsv', async (_e, csvPath) => {
  const p = csvPath || (lastPack && lastPack.csvPath);
  if (!p || !fs.existsSync(p)) return { ok: false, error: 'CSV not found' };
  shell.showItemInFolder(p);
  return { ok: true, path: p };
});
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
