// gui/renderer.js
const $ = id => document.getElementById(id);
const logEl = $('log');
function log(m){ const t=new Date().toLocaleTimeString(); logEl.textContent += '['+t+'] '+m+'\n'; logEl.scrollTop=logEl.scrollHeight; }
window.api.onStatus(log);

async function refreshButtons(){
  const { has, csvPath } = await window.api.hasPack();
  $('openCsv').disabled = !has;
  $('delete').disabled = !has;
}

$('openFolder').onclick = async () => { const r=await window.api.openWatchRoot(); log('📂 '+r.root); };

$('scan').onclick = async () => {
  const r = await window.api.scan();
  if(!r.total){ $('scanbox').innerHTML='<span style="color:#ffb454">Картинок не найдено в '+r.root+'</span>'; log('Папка пуста: '+r.root); return; }
  $('scanbox').innerHTML = Object.entries(r.byCat).map(([k,v])=>'<span class="pill">'+k+': '+v+'</span>').join('');
  log('Найдено '+r.total+' картинок: '+Object.entries(r.byCat).map(([k,v])=>k+'='+v).join(', '));
};

$('build').onclick = async () => {
  $('build').disabled=true; log('— Собираю пак —');
  const r = await window.api.buildPack();
  $('build').disabled=false;
  if(!r.ok){ log('❌ '+r.error); return; }
  log('✅ Готово: '+r.count+' картинок. CSV сохранён.');
  log('➡ Теперь: 1) открой CSV  2) загрузи его в Pinterest  3) после успеха — Удалить пак');
  await refreshButtons();
};

$('openCsv').onclick = async () => { const r=await window.api.openCsv(); if(r.ok) log('📄 '+r.path); else log('❌ '+r.error); };

$('delete').onclick = async () => {
  if(!confirm('Удалить пак из GitHub? Делай это только ПОСЛЕ успешной загрузки CSV в Pinterest.')) return;
  $('delete').disabled=true;
  const r = await window.api.deletePack({ deleteLocal: $('delLocal').checked });
  if(!r.ok){ log('❌ '+r.error); $('delete').disabled=false; return; }
  log('✅ Пак удалён из GitHub'+(r.localDeleted?(' и '+r.localDeleted+' с рабочего стола'):'')+'. Ссылки больше не работают.');
  await refreshButtons();
};

refreshButtons();
