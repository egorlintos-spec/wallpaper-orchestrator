// core/image_optimizer.js
// Compresses/optimizes images for Pinterest before upload:
//  - converts to JPEG (Pinterest-friendly, served as image/jpeg)
//  - caps the long edge (default 1600px — plenty for Pinterest)
//  - keeps shrinking quality until under the size budget (default 6 MB)
// Falls back to a plain copy if 'sharp' is unavailable, so the app never crashes.
const fs = require('fs');
const path = require('path');
const os = require('os');

let sharp = null;
try { sharp = require('sharp'); } catch { sharp = null; }

const DEFAULTS = { maxEdge: 1600, maxBytes: 6 * 1024 * 1024, minQuality: 50 };

function tmpDir() {
  const d = path.join(os.tmpdir(), 'wo-optimized');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

// Returns { path, name, optimized:boolean }. 'path' is a JPEG ready to upload.
async function optimize(localPath, opts = {}, onStatus = () => {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const base = path.basename(localPath, path.extname(localPath));
  const outName = base + '.jpg';
  const outPath = path.join(tmpDir(), outName);

  if (!sharp) {
    onStatus('⚠️ sharp not available — uploading original ' + path.basename(localPath));
    return { path: localPath, name: path.basename(localPath), optimized: false };
  }

  let quality = 85;
  let buf;
  // Resize once, then iterate quality down until within budget.
  const pipeline = sharp(localPath, { failOn: 'none' })
    .rotate() // respect EXIF orientation
    .resize({ width: cfg.maxEdge, height: cfg.maxEdge, fit: 'inside', withoutEnlargement: true });

  for (;;) {
    buf = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buf.length <= cfg.maxBytes || quality <= cfg.minQuality) break;
    quality -= 10;
  }
  fs.writeFileSync(outPath, buf);
  const mb = (buf.length / 1024 / 1024).toFixed(1);
  onStatus('🗜️ ' + path.basename(localPath) + ' → ' + outName + ' (' + mb + ' MB, q' + quality + ')');
  return { path: outPath, name: outName, optimized: true };
}

module.exports = { optimize, hasSharp: () => !!sharp };
