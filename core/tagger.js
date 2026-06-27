// core/tagger.js
// Builds the pin title + description (folder tags + popular tags + Boosty link).
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Title from file name: "noir-dor_perfume.png" -> "Noir Dor Perfume"
function titleFromFile(file) {
  const base = path.basename(file, path.extname(file));
  return base.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// Combine category tags + popular tags, dedupe, cap at maxTags.
function buildTags(category) {
  const cat = config.categories[category] || [];
  const all = [...cat, ...config.popularTags];
  const seen = new Set();
  const out = [];
  for (const t of all) {
    const k = t.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(t); }
    if (out.length >= config.maxTags) break;
  }
  return out;
}

// If a sidecar .txt exists next to the image, use its first line as title and
// the rest as extra description text.
function readSidecar(imagePath) {
  const txt = imagePath.replace(/\.[^.]+$/, '.txt');
  if (!fs.existsSync(txt)) return null;
  const lines = fs.readFileSync(txt, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return { title: lines[0], body: lines.slice(1).join(' ') };
}

function buildPin(imagePath, category) {
  const side = readSidecar(imagePath);
  const title = (side && side.title) || titleFromFile(imagePath);
  const tags = buildTags(category);
  const parts = [];
  if (side && side.body) parts.push(side.body);
  parts.push(tags.join(' '));
  parts.push(config.pinterestLink);
  const description = parts.join('\n\n');
  return { title, description, tags, link: config.pinterestLink, board: category };
}

module.exports = { buildPin, buildTags, titleFromFile };
