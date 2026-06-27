// core/watcher.js
// Watches category folders for new images and posts them to Pinterest,
// either immediately or on a drip schedule. Keeps a ledger so nothing reposts.
const fs = require('fs');
const path = require('path');
const config = require('../config');
const tagger = require('./tagger');
const pinterest = require('./pinterest_driver');

const LEDGER = path.join(config.homeDir, 'posted.json');

function loadLedger() {
  try { return new Set(JSON.parse(fs.readFileSync(LEDGER, 'utf8'))); } catch { return new Set(); }
}
function saveLedger(set) {
  try { fs.mkdirSync(config.homeDir, { recursive: true }); } catch {}
  fs.writeFileSync(LEDGER, JSON.stringify([...set], null, 2));
}

function isImage(file) {
  return config.imageExts.includes(path.extname(file).toLowerCase());
}

// Scan all category folders, return [{ imagePath, category }] not yet posted.
function scan(ledger) {
  const found = [];
  for (const category of Object.keys(config.categories)) {
    const dir = path.join(config.watchRoot, category);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!isImage(full)) continue;
      if (ledger.has(full)) continue;
      try { if (!fs.statSync(full).isFile()) continue; } catch { continue; }
      found.push({ imagePath: full, category });
    }
  }
  return found;
}

async function postOne(item, onStatus) {
  const pin = tagger.buildPin(item.imagePath, item.category);
  onStatus('Posting: ' + path.basename(item.imagePath) + '  → board "' + (config.boardPerCategory ? pin.board : 'default') + '"');
  await pinterest.launch();
  if (!(await pinterest.isLoggedIn())) await pinterest.waitForLogin(onStatus);
  await pinterest.createPin({
    imagePath: item.imagePath,
    title: pin.title,
    description: pin.description,
    link: pin.link,
    board: config.boardPerCategory ? pin.board : undefined,
  }, onStatus);
  onStatus('✅ Posted: ' + pin.title);
}

let running = false;
let timer = null;

// Start watching. Returns a stop() function.
async function start(onStatus = () => {}) {
  if (running) { onStatus('Watcher already running.'); return stop; }
  running = true;
  const ledger = loadLedger();

  // queue of pending items (FIFO)
  let queue = scan(ledger);
  onStatus('Watching ' + config.watchRoot + ' — ' + queue.length + ' image(s) pending. Mode: ' + config.postMode);

  // interval between posts
  const dripMs = config.postMode === 'schedule'
    ? Math.max(config.pinDelayMs, Math.floor((24 * 3600 * 1000) / Math.max(1, config.postsPerDay)))
    : config.pinDelayMs;

  async function tick() {
    if (!running) return;
    // refresh queue with any newly-added files
    const fresh = scan(ledger).filter(i => !queue.some(q => q.imagePath === i.imagePath));
    queue.push(...fresh);

    const item = queue.shift();
    if (item) {
      try {
        await postOne(item, onStatus);
        ledger.add(item.imagePath); saveLedger(ledger);
      } catch (e) {
        onStatus('⚠️ Failed: ' + path.basename(item.imagePath) + ' — ' + e.message);
        queue.push(item); // retry later
      }
    } else {
      onStatus('Queue empty — waiting for new images…');
    }
    if (running) timer = setTimeout(tick, dripMs);
  }

  timer = setTimeout(tick, 1000);
  return stop;
}

function stop() {
  running = false;
  if (timer) clearTimeout(timer);
  try { pinterest.close(); } catch {}
}

module.exports = { start, stop, scan, loadLedger };
