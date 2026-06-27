// core/csv_builder.js — builds the Pinterest bulk-upload CSV
const path = require('path');
const fs = require('fs');
const config = require('../config');

function titleFromFile(file) {
  return path.basename(file, path.extname(file))
    .replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function buildTags(category) {
  const cat = config.categoryTags[category] || ['#design', '#aesthetic', '#inspiration'];
  const seen = new Set(); const out = [];
  for (const t of [...cat, ...config.popularTags]) {
    const k = t.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(t); }
    if (out.length >= config.maxTags) break;
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
function cell(v) { v = (v == null ? '' : String(v)); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

// items: [{ localPath, category, rawUrl }]
function build(items) {
  const rows = [['Title','Media URL','Pinterest board','Thumbnail','Description','Link','Publish date','Keywords']];
  for (const it of items) {
    const side = readSidecar(it.localPath);
    const title = (side && side.title) || titleFromFile(it.localPath);
    const tags = buildTags(it.category);
    const parts = [];
    if (side && side.body) parts.push(side.body);
    parts.push(tags.join(' '));
    let description = parts.join('  ');
    if (description.length > 500) description = description.slice(0, 497) + '...';
    const keywords = tags.map(t => t.replace(/^#/, '')).join(', ');
    rows.push([title, it.rawUrl, it.category, '', description, config.pinterestLink, '', keywords]);
  }
  return rows.map(r => r.map(cell).join(',')).join('\n') + '\n';
}
module.exports = { build, titleFromFile };
