// gui/renderer.js
const $ = id => document.getElementById(id);
const logEl = $('log');
function log(m){ const t=new Date().toLocaleTimeString(); logEl.textContent += '['+t+'] '+m+'\n'; logEl.scrollTop=logEl.scrollHeight; }
window.api.onStatus(log);

async function refreshButtons(){
  const { has } = await window.api.hasPack();
  $('openCsv').disabled = !has;
  $('delete').disabled = !has;
}
async function refreshSettings(){
  const s = await window.api.getSettings();
  $('tokBadge').className = 'badge ' + (s.hasToken ? 'ok' : 'no');
  $('tokBadge').textContent = s.hasToken ? ('токен задан ('+s.tokenHint+')') : 'токен не задан';
  $('build').disabled = !s.hasToken;
  return s;
}

// --- Settings modal ---
$('openSettings').onclick = async () => {
  const s = await window.api.getSettings();
  $('sToken').value = '';
  $('sToken').placeholder = s.hasToken ? ('сохранён: '+s.tokenHint+' (пусто = не менять)') : 'github_pat_… или ghp_…';
  $('sOwner').value = s.owner||''; $('sRepo').value = s.repo||'';
  $('sBranch').value = s.branch||'main'; $('sBoosty').value = s.boosty||'';
  $('sWatch').value = s.watchRoot||'';
  $('settingsOv').classList.add('show');
};
$('cancelSettings').onclick = () => $('settingsOv').classList.remove('show');
$('saveSettings').onclick = async () => {
  await window.api.saveSettings({
    token: $('sToken').value, owner: $('sOwner').value.trim(), repo: $('sRepo').value.trim(),
    branch: $('sBranch').value.trim()||'main', boosty: $('sBoosty').value.trim(), watchRoot: $('sWatch').value.trim(),
  });
  $('settingsOv').classList.remove('show');
  log('✅ Настройки сохранены');
  await refreshSettings();
};

$('openFolder').onclick = async () => { const r=await window.api.openWatchRoot(); log('📂 '+r.root); };
$('scan').onclick = async () => {
  const r = await window.api.scan();
  if(!r.total){ $('scanbox').innerHTML='<span style="color:#ffb454">Картинок не найдено в '+r.root+'</span>'; return; }
  $('scanbox').innerHTML = Object.entries(r.byCat).map(([k,v])=>'<span class="pill">'+k+': '+v+'</span>').join('');
  log('Найдено '+r.total+' картинок');
};
$('build').onclick = async () => {
  $('build').disabled=true; log('— Собираю пак —');
  const r = await window.api.buildPack();
  await refreshSettings();
  if(!r.ok){ log('❌ '+r.error); return; }
  log('✅ Готово: '+r.count+' картинок. CSV сохранён.');
  log('➡ Теперь: открой CSV → загрузи в Pinterest → потом «Удалить пак»');
  await refreshButtons();
};
$('openCsv').onclick = async () => { const r=await window.api.openCsv(); if(r.ok) log('📄 '+r.path); else log('❌ '+r.error); };
$('delete').onclick = async () => {
  if(!confirm('Удалить пак из GitHub? Только ПОСЛЕ успешной загрузки в Pinterest.')) return;
  $('delete').disabled=true;
  const r = await window.api.deletePack({ deleteLocal: $('delLocal').checked });
  if(!r.ok){ log('❌ '+r.error); $('delete').disabled=false; return; }
  log('✅ Пак удалён из GitHub'+(r.localDeleted?(' и '+r.localDeleted+' локально'):''));
  await refreshButtons();
};

refreshSettings(); refreshButtons();
