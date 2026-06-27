// core/reve_driver.js
// Generates images via the Reve AI REST API (https://api.reve.com).
// No browser, no login, no captcha — a single authenticated POST returns the image.
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ENDPOINT = config.reveEndpoint || 'https://api.reve.com/v1/image/create';

// Map our wallpaper sizes to Reve aspect ratios. iPhone wallpaper = 9:16.
function pickAspect(ratio) {
  const allowed = ['16:9','3:2','4:3','1:1','3:4','2:3','9:16','auto'];
  return allowed.includes(ratio) ? ratio : '9:16';
}

// Generate one image and save it to outputDir. Returns the saved file path.
async function generate(prompt, fileName, onStatus = () => {}) {
  const key = config.reveApiKey || process.env.REVE_API_KEY;
  if (!key) throw new Error('Missing REVE_API_KEY. Put it in your .env file (see .env.example).');

  if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir, { recursive: true });

  onStatus('Requesting image from Reve…');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: pickAspect(config.aspectRatio || '9:16'),
      version: config.reveVersion || 'latest',
    }),
  });

  let data;
  const text = await res.text();
  try { data = JSON.parse(text); }
  catch { throw new Error('Reve returned non-JSON (HTTP ' + res.status + '): ' + text.slice(0, 200)); }

  if (!res.ok || data.error_code) {
    const code = data.error_code || ('HTTP_' + res.status);
    if (code === 'PARTNER_API_BUDGET_EXHAUSTED')
      throw new Error('Reve API budget exhausted. Add funds in the Reve API Budget panel and retry.');
    if (res.status === 401 || code === 'UNAUTHORIZED')
      throw new Error('Reve API key rejected (401). Check REVE_API_KEY in .env.');
    throw new Error('Reve error: ' + code + ' — ' + (data.message || ''));
  }

  if (data.content_violation) throw new Error('Prompt rejected by Reve content policy. Try a different prompt.');
  if (!data.image) throw new Error('Reve response had no image field.');

  const outPath = path.join(config.outputDir, fileName);
  fs.writeFileSync(outPath, Buffer.from(data.image, 'base64'));
  onStatus('Saved: ' + outPath +
    (data.credits_used != null ? '  (credits used: ' + data.credits_used + ', remaining: ' + data.credits_remaining + ')' : ''));
  return { path: outPath, creditsUsed: data.credits_used, creditsRemaining: data.credits_remaining, requestId: data.request_id };
}

module.exports = { generate, pickAspect };
