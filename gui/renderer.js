const log = document.getElementById('log');
const state = document.getElementById('state');
function add(line){ log.textContent += line + '\n'; log.scrollTop = log.scrollHeight; }
window.api.onStatus(add);
async function run(uploadToPinterest){
  document.getElementById('testBtn').disabled = true;
  document.getElementById('fullBtn').disabled = true;
  state.textContent = uploadToPinterest ? 'full run...' : 'test run...';
  add('--- run started ---');
  const r = await window.api.runOnce({ uploadToPinterest });
  add(r.ok ? '--- DONE ---' : '--- FAILED: ' + r.error + ' ---');
  state.textContent = r.ok ? 'done' : 'error';
  document.getElementById('testBtn').disabled = false;
  document.getElementById('fullBtn').disabled = false;
}
document.getElementById('testBtn').onclick = () => run(false);
document.getElementById('fullBtn').onclick = () => run(true);