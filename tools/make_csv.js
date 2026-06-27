#!/usr/bin/env node
// tools/make_csv.js
// Walks category folders under pins/ and produces a Pinterest bulk-upload CSV.
// Media URL points to raw.githubusercontent.com (free public hosting of the
// images committed to this repo). Run locally or via GitHub Actions.
//
// CSV columns (Pinterest bulk upload):
//   Title, Media URL, Pinterest board, Thumbnail, Description, Link, Publish date, Keywords

const fs = require('fs');
const path = require('path');

// ---- Settings (override via env) ----
const REPO_SLUG = process.env.GITHUB_REPOSITORY || 'egorlintos-spec/wallpaper-orchestrator';
const BRANCH    = process.env.GITHUB_REF_NAME || process.env.WO_BRANCH || 'main';
const PINS_DIR  = process.env.WO_PINS_DIR || 'pins';
const LINK      = process.env.WO_LINK || 'https://boosty.to/fallenowl';
const OUT       = process.env.WO_OUT || 'pinterest_upload.csv';
const MAX_TAGS  = 18;

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// Category -> hashtags
const CATEGORY_TAGS = {
  Ads:      ['#ad', '#branding', '#productdesign', '#advertising'],
  Magazine: ['#editorial', '#magazine', '#fashion', '#cover'],
  Posters:  ['#poster', '#posterdesign', '#vintageposter', '#travelposter'],
  Art:      ['#art', '#digitalart', '#aiart', '#fineart'],
  Other:    ['#design', '#aesthetic', '#wallpaper'],
};
const POPULAR_TAGS = ['#pinterest', '#inspiration', '#aesthetic', '#design',
  '#art', '#creative', '#moodboard', '#wallpaper', '#aiart', '#trending'];

function titleFromFile(file) {
  return path.basename(file, path.extname(file))
    .replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function buildTags(category) {
  const cat = CATEGORY_TAGS[category] || ['#design', '#aesthetic', '#inspiration'];
  const seen = new Set(); const out = [];
  for (const t of [...cat, ...POPULAR_TAGS]) {
    const k = t.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(t); }
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}
function readSidecar(imagePath) {
  const txt = imagePath.replace(/\.[^.]+$/, '.txt');
  if (!fs.existsSync(txt)) return null;
  const lines = fs.readFileSync(txt, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return { title: lines[0], body: lines.slice(1).join(' ') };
}
function csvCell(v) {
  v = (v == null ? '' : String(v));
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function rawUrl(relPath) {
  const enc = relPath.split('/').map(encodeURIComponent).join('/');
  return 'https://raw.githubusercontent.com/' + REPO_SLUG + '/' + BRANCH + '/' + enc;
}

function main() {
  const rows = [['Title','Media URL','Pinterest board','Thumbnail','Description','Link','Publish date','Keywords']];
  const root = path.resolve(PINS_DIR);
  if (!fs.existsSync(root)) { console.error('No pins/ folder found at ' + root); process.exit(1); }

  let count = 0;
  for (const category of fs.readdirSync(root)) {
    const dir = path.join(root, category);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (!IMAGE_EXTS.includes(path.extname(name).toLowerCase())) continue;
      if (!fs.statSync(full).isFile()) continue;

      const side = readSidecar(full);
      const title = (side && side.title) || titleFromFile(name);
      const tags = buildTags(category);
      const descParts = [];
      if (side && side.body) descParts.push(side.body);
      descParts.push(tags.join(' '));
      let description = descParts.join('  ');
      if (description.length > 500) description = description.slice(0, 497) + '...';
      const keywords = tags.map(t => t.replace(/^#/, '')).join(', ');
      const mediaUrl = rawUrl(PINS_DIR + '/' + category + '/' + name);

      rows.push([title, mediaUrl, category, '', description, LINK, '', keywords]);
      count++;
    }
  }

  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n';
  fs.writeFileSync(OUT, csv, 'utf8');
  console.log('✅ Wrote ' + count + ' pins to ' + OUT);
  console.log('   Repo: ' + REPO_SLUG + ' @ ' + BRANCH);
}
main();
