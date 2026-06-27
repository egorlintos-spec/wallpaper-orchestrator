// core/chatgpt_driver.js
// Drives ChatGPT via Playwright by attaching to an ALREADY logged-in Chrome over CDP.
// No password / 2FA needed at runtime — reuses the live session in .SimularChromeProfile.
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let browser = null;   // CDP browser handle
let context = null;
let page = null;

const CDP_URL = config.cdpUrl || 'http://localhost:9222';
const CDP_PORT = config.cdpPort || 9222;
const CHROME_EXE = config.chromeExe || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = config.chromeProfileDir || (process.env.LOCALAPPDATA + '\\.SimularChromeProfile');

function cdpAlive() {
  try { execSync('powershell -Command "(Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 \'' + CDP_URL + '/json/version\').StatusCode"', { stdio: 'ignore' }); return true; }
  catch { return false; }
}

async function ensureChrome(onStatus = () => {}) {
  // If a Chrome with the debug port is already up, reuse it.
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
    return browser;
  } catch (e) {
    onStatus('Starting Chrome with remote debugging…');
    spawn(CHROME_EXE, [
      '--remote-debugging-port=' + CDP_PORT,
      '--user-data-dir=' + PROFILE_DIR,
      '--no-first-run', '--no-default-browser-check', '--start-maximized',
    ], { detached: true, stdio: 'ignore' }).unref();
    // wait for it to come up
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try { browser = await chromium.connectOverCDP(CDP_URL); return browser; } catch {}
    }
    throw new Error('Could not connect to Chrome over CDP at ' + CDP_URL);
  }
}

async function launch(onStatus = () => {}) {
  if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir, { recursive: true });
  await ensureChrome(onStatus);
  context = browser.contexts()[0] || await browser.newContext();
  // reuse an existing ChatGPT tab if present, else open one
  const pages = context.pages();
  page = pages.find(p => /chatgpt\.com|chat\.openai\.com/.test(p.url())) || pages[0] || await context.newPage();
  await page.goto(config.chatgptUrl, { waitUntil: 'domcontentloaded' });
  return page;
}

// Logged in if the session endpoint returns a user (robust, independent of UI).
async function isLoggedIn() {
  try {
    const r = await page.evaluate(async () => {
      try { const x = await fetch('/api/auth/session', { credentials: 'include' }); const j = await x.json(); return !!(j && j.user); } catch { return false; }
    });
    return r;
  } catch { return false; }
}

async function waitForLogin(onStatus = () => {}) {
  onStatus('Checking ChatGPT session…');
  for (let i = 0; i < 120; i++) {
    if (await isLoggedIn()) { onStatus('Logged in to ChatGPT.'); return; }
    await page.waitForTimeout(1000);
  }
  throw new Error('Not logged in — open ' + config.chatgptUrl + ' in the Chrome profile and sign in once.');
}

async function sendPrompt(prompt, onStatus = () => {}) {
  const composer = await page.waitForSelector('#prompt-textarea, div[contenteditable="true"]', { timeout: 30000 });
  await composer.click();
  const fullPrompt = 'Generate an image: ' + prompt;
  await composer.fill(fullPrompt).catch(async () => { await page.keyboard.type(fullPrompt); });
  await page.keyboard.press('Enter');
  onStatus('Prompt sent, waiting for image generation…');
}

async function downloadImage(fileName, onStatus = () => {}) {
  const imgSel = 'img[alt*="Generated"], img[src*="oaiusercontent"], img[src*="dalle"]';
  await page.waitForSelector(imgSel, { timeout: 180000 });
  await page.waitForTimeout(2000);
  const imgs = await page.$$(imgSel);
  const img = imgs[imgs.length - 1];
  const src = await img.getAttribute('src');
  onStatus('Image ready, downloading…');
  const outPath = path.join(config.outputDir, fileName);
  const buffer = await page.evaluate(async (url) => {
    const res = await fetch(url); const blob = await res.blob(); const arr = await blob.arrayBuffer();
    return Array.from(new Uint8Array(arr));
  }, src);
  fs.writeFileSync(outPath, Buffer.from(buffer));
  onStatus('Saved: ' + outPath);
  return outPath;
}

// Detach (do NOT close the shared Chrome — just disconnect the CDP handle).
async function close() {
  try { if (browser) await browser.close(); } catch {}
  browser = null; context = null; page = null;
}

module.exports = { launch, isLoggedIn, waitForLogin, sendPrompt, downloadImage, close };