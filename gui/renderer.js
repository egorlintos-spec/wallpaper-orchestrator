// gui/renderer.js
const logEl = document.getElementById('log');
const state = document.getElementById('state');
const startBtn = document.getElementById('startBtn');
const stopBtn  = document.getElementById('stopBtn');
const scanBtn  = document.getElementById('scanBtn');
const openBtn  = document.getElementById('openBtn');

function log(msg) {
  const line = document.createElement('div');
  line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}
function setRunning(on) {
  startBtn.disabled = on; stopBtn.disabled = !on;
  state.textContent = on ? 'watching' : 'idle';
  state.className = 'pill' + (on ? ' on' : '');
}

window.api.onStatus(log);

(async () => {
  const cfg = await window.api.getConfig();
  document.getElementById('root').textContent = cfg.watchRoot;
  document.getElementById('mode').textContent = cfg.postMode + (cfg.postMode === 'schedule' ? ' (' + cfg.postsPerDay + '/day)' : '');
})();

startBtn.onclick = async () => { setRunning(true); await window.api.startWatch(); };
stopBtn.onclick  = async () => { await window.api.stopWatch(); setRunning(false); };
scanBtn.onclick  = async () => { const r = await window.api.scan(); r.pending.forEach(p => log('  • ' + p.category + '/' + p.file)); };
openBtn.onclick  = () => window.api.openFolder();
