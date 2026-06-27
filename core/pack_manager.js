// core/pack_manager.js
// The whole flow, local-first:
//   scan(): find images in Desktop category folders
//   buildPack(): upload each image to GitHub -> collect raw URLs -> write CSV locally
//   deletePack(): remove this pack's images from GitHub (call AFTER Pinterest import succeeds)
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const gh = require('./github_client');
const csv = require('./csv_builder');

const IMG_RE = /\.(png|jpe?g|webp)$/i;

function resolveWatchRoot() {
  let root = config.watchRoot;
  if (!path.isAbsolute(root)) root = path.join(os.homedir(), root);
  return root;
}

// Scan all category folders, return [{ localPath, category, name }]
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

// Upload every scanned image to GitHub under pins/<Category>/<file>, then write CSV.
// Returns { csvPath, items: [{...,rawUrl,repoPath}], count }
async function buildPack(onStatus = () => {}) {
  const scanned = scan();
  if (!scanned.length) throw new Error('No images found in ' + resolveWatchRoot() + ' (categories: ' + config.categories.join(', ') + ')');
  onStatus('Found ' + scanned.length + ' image(s). Uploading to GitHub...');
  const uploaded = [];
  for (const it of scanned) {
    const repoPath = 'pins/' + it.category + '/' + it.name;
    const { rawUrl } = await gh.uploadFile(it.localPath, repoPath, onStatus);
    uploaded.push({ ...it, rawUrl, repoPath });
  }
  onStatus('Building CSV...');
  const csvText = csv.build(uploaded);
  const outDir = path.join(os.homedir(), 'WallpaperOrchestrator');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const csvPath = path.join(outDir, 'pinterest_upload_' + stamp + '.csv');
  fs.writeFileSync(csvPath, csvText, 'utf8');
  // Save a manifest so deletePack knows exactly what this pack uploaded.
  const manifestPath = csvPath.replace(/\.csv$/, '.pack.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    repoPaths: uploaded.map(u => u.repoPath),
    csvPath,
  }, null, 2), 'utf8');
  onStatus('✅ CSV ready: ' + csvPath);
  return { csvPath, manifestPath, items: uploaded, count: uploaded.length };
}

// Delete the uploaded images for a pack from GitHub. Pass the manifest path
// (or a repoPaths array). Optionally also remove local files from Desktop.
async function deletePack(manifestPathOrPaths, opts = {}, onStatus = () => {}) {
  let repoPaths, manifestPath = null, localPaths = [];
  if (Array.isArray(manifestPathOrPaths)) {
    repoPaths = manifestPathOrPaths;
  } else {
    manifestPath = manifestPathOrPaths;
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    repoPaths = m.repoPaths || [];
  }
  onStatus('Deleting ' + repoPaths.length + ' file(s) from GitHub...');
  let deleted = 0;
  for (const rp of repoPaths) { if (await gh.deleteFile(rp, onStatus)) deleted++; }

  // Optionally clear the local Desktop folders too.
  if (opts.deleteLocal) {
    const root = resolveWatchRoot();
    for (const rp of repoPaths) {
      const local = path.join(root, rp.replace(/^pins\//, ''));
      if (fs.existsSync(local)) { fs.unlinkSync(local); localPaths.push(local); onStatus('🗑️ local: ' + local); }
    }
  }
  if (manifestPath && fs.existsSync(manifestPath)) {
    fs.renameSync(manifestPath, manifestPath + '.done');
  }
  onStatus('✅ Pack deleted (' + deleted + ' remote' + (opts.deleteLocal ? ', ' + localPaths.length + ' local' : '') + ')');
  return { deleted, localDeleted: localPaths.length };
}

module.exports = { scan, buildPack, deletePack, resolveWatchRoot };
