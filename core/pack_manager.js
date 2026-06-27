// core/pack_manager.js
// Flow: scan() -> buildPack() [optimize -> upload -> CSV] -> deletePack()
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const gh = require('./github_client');
const csv = require('./csv_builder');
const optimizer = require('./image_optimizer');

const IMG_RE = /\.(png|jpe?g|webp)$/i;

function resolveWatchRoot() {
  let root = config.watchRoot;
  if (!path.isAbsolute(root)) root = path.join(os.homedir(), root);
  return root;
}

function scan() {
  const root = resolveWatchRoot();
  const items = [];
  for (const category of config.categories) {
    const dir = path.join(root, category);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (IMG_RE.test(name)) items.push({ localPath: path.join(dir, name), category, name });
    }
  }
  return items;
}

// Optimize each image to JPEG, upload under pins/<Category>/<file>.jpg, then write CSV.
async function buildPack(onStatus = () => {}) {
  const scanned = scan();
  if (!scanned.length) throw new Error('No images found in ' + resolveWatchRoot() + ' (categories: ' + config.categories.join(', ') + ')');
  onStatus('Found ' + scanned.length + ' image(s). Optimizing + uploading...');
  if (!optimizer.hasSharp()) onStatus('⚠️ image compression unavailable — uploading originals (may exceed Pinterest limits).');

  const uploaded = [];
  for (const it of scanned) {
    // 1) optimize → JPEG within size budget
    const opt = await optimizer.optimize(it.localPath, {
      maxEdge: config.maxEdge || 1600,
      maxBytes: (config.maxImageMB || 6) * 1024 * 1024,
    }, onStatus);
    // 2) upload optimized file
    const repoPath = 'pins/' + it.category + '/' + opt.name;
    const { rawUrl } = await gh.uploadFile(opt.path, repoPath, onStatus);
    // keep localPath = ORIGINAL (for title/sidecar + optional local delete), but track repoPath of uploaded jpg
    uploaded.push({ ...it, rawUrl, repoPath, uploadedName: opt.name });
  }

  onStatus('Building CSV...');
  const csvText = csv.build(uploaded);
  const outDir = path.join(os.homedir(), 'WallpaperOrchestrator');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const csvPath = path.join(outDir, 'pinterest_upload_' + stamp + '.csv');
  fs.writeFileSync(csvPath, csvText, 'utf8');
  const manifestPath = csvPath.replace(/\.csv$/, '.pack.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    repoPaths: uploaded.map(u => u.repoPath),
    originals: uploaded.map(u => u.localPath),
    csvPath,
  }, null, 2), 'utf8');
  onStatus('✅ CSV ready: ' + csvPath);
  return { csvPath, manifestPath, items: uploaded, count: uploaded.length };
}

async function deletePack(manifestPathOrPaths, opts = {}, onStatus = () => {}) {
  let repoPaths, originals = [], manifestPath = null, localPaths = [];
  if (Array.isArray(manifestPathOrPaths)) {
    repoPaths = manifestPathOrPaths;
  } else {
    manifestPath = manifestPathOrPaths;
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    repoPaths = m.repoPaths || [];
    originals = m.originals || [];
  }
  onStatus('Deleting ' + repoPaths.length + ' file(s) from GitHub...');
  let deleted = 0;
  for (const rp of repoPaths) { if (await gh.deleteFile(rp, onStatus)) deleted++; }

  if (opts.deleteLocal) {
    for (const lp of originals) {
      if (lp && fs.existsSync(lp)) { fs.unlinkSync(lp); localPaths.push(lp); onStatus('🗑️ local: ' + lp); }
    }
  }
  if (manifestPath && fs.existsSync(manifestPath)) fs.renameSync(manifestPath, manifestPath + '.done');
  onStatus('✅ Pack deleted (' + deleted + ' remote' + (opts.deleteLocal ? ', ' + localPaths.length + ' local' : '') + ')');
  return { deleted, localDeleted: localPaths.length };
}

module.exports = { scan, buildPack, deletePack, resolveWatchRoot };
