// main.js — Electron main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const orchestrator = require('./core/orchestrator');

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 760, height: 640,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true },
  });
  win.loadFile(path.join(__dirname, 'gui', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

function send(line) { if (win) win.webContents.send('status', line); }

ipcMain.handle('run-once', async (_e, opts) => {
  try {
    const res = await orchestrator.runOnce(opts || {}, send);
    return { ok: true, res };
  } catch (err) {
    send('ERROR: ' + err.message);
    return { ok: false, error: err.message };
  }
});