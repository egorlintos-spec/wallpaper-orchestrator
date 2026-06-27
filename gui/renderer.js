// gui/renderer.js
const logEl=document.getElementById('log'), state=document.getElementById('state');
const startBtn=document.getElementById('startBtn'), stopBtn=document.getElementById('stopBtn');
const scanBtn=document.getElementById('scanBtn'), openBtn=document.getElementById('openBtn');
const reportBtn=document.getElementById('reportBtn');

function log(msg, muted){
  const l=document.createElement('div');
  if (muted) l.className='muted';
  l.textContent='['+new Date().toLocaleTimeString()+']  '+msg;
  logEl.appendChild(l); logEl.scrollTop=logEl.scrollHeight;
}
function setRunning(on){
  startBtn.disabled=on; stopBtn.disabled=!on;
  state.innerHTML='<span class="led"></span>'+(on?'Watching':'Idle');
  state.className='status'+(on?' on':'');
}
window.api.onStatus(log);

(async()=>{
  const c=await window.api.getConfig();
  document.getElementById('root').textContent=c.watchRoot;
  document.getElementById('mode').textContent=c.postMode+(c.postMode==='schedule'?'  ('+c.postsPerDay+'/day)':'');
  document.getElementById('cats').textContent=(c.categories||[]).join(', ');
  log('Ready. Press Start to begin watching.', true);
})();

startBtn.onclick=async()=>{ setRunning(true); await window.api.startWatch(); };
stopBtn.onclick=async()=>{ await window.api.stopWatch(); setRunning(false); };
scanBtn.onclick=async()=>{ const r=await window.api.scan(); if(!r.pending.length) log('No pending images.',true); r.pending.forEach(p=>log('  • '+p.category+' / '+p.file)); };
openBtn.onclick=()=>window.api.openFolder();
reportBtn.onclick=async()=>{ if(window.api.report){ log('Generating report…',true); await window.api.report(); } else { log('Report module activates after Pinterest API is connected.',true); } };
