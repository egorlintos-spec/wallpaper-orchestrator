// core/chatgpt_driver.js
// Drives ChatGPT via Playwright by attaching to an ALREADY logged-in Chrome over CDP.
// No password / 2FA needed at runtime — reuses the live session in the Chrome profile.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let browser = null, context = null, page = null;

const CDP_URL = config.cdpUrl || 'http://localhost:9222';
const CDP_PORT = config.cdpPort || 9222;
const CHROME_EXE = config.chromeExe || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = config.chromeProfileDir || path.join(process.env.LOCALAPPDATA || config.homeDir || __dirname, '.SaiChromeProfile');

async function tryConnect() {
  try { return await chromium.connectOverCDP(CDP_URL); } catch { return null; }
}

async function ensureChrome(onStatus = () => {}) {
  let b = await tryConnect();
  if (b) return b;
  onStatus('Starting Chrome with remote debugging…');
  try { fs.mkdirSync(PROFILE_DIR, { recursive: true }); } catch {}
  spawn(CHROME_EXE, [
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + PROFILE_DIR,
    '--no-first-run', '--no-default-browser-check', '--start-maximized',
    'https://chatgpt.com/',
  ], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 1000));
    b = await tryConnect();
    if (b) return b;
  }
  throw new Error('Could not start Chrome with remote debugging on port ' + CDP_PORT +
    '. Make sure Google Chrome is installed at: ' + CHROME_EXE);
}

async function launch(onStatus = () => {}) {
  if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir, { recursive: true });
  browser = await ensureChrome(onStatus);
  context = browser.contexts()[0] || await browser.newContext();
  const pages = context.pages();
  page = pages.find(p => /chatgpt\.com|chat\.openai\.com/.test(p.url())) || pages[0] || await context.newPage();
  // Robust navigation to avoid transient Remix "Route Error"
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(config.chatgptUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);
      break;
    } catch (e) { if (attempt === 2) throw e; await page.waitForTimeout(1500); }
  }
  return page;
}

async function isLoggedIn() {
  try {
    return await page.evaluate(async () => {
      try { const x = await fetch('/api/auth/session', { credentials: 'include' });
            const j = await x.json(); return !!(j && j.user); } catch { return false; }
    });
  } catch { return false; }
}

// Bring the Chrome window forward and wait until the user logs in.
async function waitForLogin(onStatus = () => {}) {
  onStatus('⚠️ Not logged in to ChatGPT. A Chrome window is open — please sign in at chatgpt.com, then keep this app running.');
  try { await page.bringToFront(); } catch {}
  // poll up to 5 minutes
  for (let i = 0; i < 300; i++) {
    if (await isLoggedIn()) { onStatus('✅ Logged in to ChatGPT.'); await page.waitForTimeout(1500); return; }
    await page.waitForTimeout(1000);
  }
  throw new Error('Still not logged in to ChatGPT after waiting. Please sign in at chatgpt.com in the opened Chrome window and try again.');
}

async function sendPrompt(prompt, onStatus = () => {}) {
  let composer;
  try {
    composer = await page.waitForSelector('#prompt-textarea, div[contenteditable="true"], textarea', { timeout: 30000 });
  } catch (e) {
    throw new Error('Could not find the ChatGPT message box. Make sure you are logged in at chatgpt.com.');
  }
  await composer.click();
  const fullPrompt = 'Create an image: ' + prompt;
  try { await composer.fill(fullPrompt); }
  catch { await page.keyboard.type(fullPrompt); }
  await page.keyboard.press('Enter');
  onStatus('Prompt sent, waiting for image generation…');
}

async function downloadImage(fileName, onStatus = () => {}) {
  const imgSel = 'img[alt*="Generated"], img[src*="oaiusercontent"], img[src*="dalle"], img[src*="files"]';
  try {
    await page.waitForSelector(imgSel, { timeout: 180000 });
  } catch (e) {
    throw new Error('No image was generated in time. On the ChatGPT Free plan image generation is limited — try again later or use a paid plan.');
  }
  await page.waitForTimeout(2000);
  const imgs = await page.$$(imgSel);
  const img = imgs[imgs.length - 1];
  const src = await img.getAttribute('src');
  onStatus('Image ready, downloading…');
  const outPath = path.join(config.outputDir, fileName);
  const bytes = await page.evaluate(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Image download failed: HTTP ' + res.status);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) throw new Error('Got an HTML page instead of an image — likely not logged in.');
    const arr = await (await res.blob()).arrayBuffer();
    return Array.from(new Uint8Array(arr));
  }, src);
  fs.writeFileSync(outPath, Buffer.from(bytes));
  onStatus('Saved: ' + outPath);
  return outPath;
}

async function close() {
  try { if (browser) await browser.close(); } catch {}
  browser = null; context = null; page = null;
}

module.exports = { launch, isLoggedIn, waitForLogin, sendPrompt, downloadImage, close };
