// core/pinterest_driver.js
// Uploads a pin to Pinterest via Playwright UI automation (no API needed).
// Reuses a persistent profile so you stay logged in.
const { chromium } = require('playwright');
const path = require('path');
const config = require('../config');

let context = null, page = null;
const PROFILE = path.join(__dirname, '..', '.pinterest-profile');

async function launch() {
  context = await chromium.launchPersistentContext(PROFILE, {
    headless: config.headless,
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
  });
  page = context.pages()[0] || await context.newPage();
  await page.goto('https://www.pinterest.com/', { waitUntil: 'domcontentloaded' });
  return page;
}

async function isLoggedIn() {
  try { await page.waitForSelector('[data-test-id="header-profile"], [aria-label="Account menu"]', { timeout: 8000 }); return true; }
  catch { return false; }
}

async function waitForLogin(onStatus = () => {}) {
  onStatus('Waiting for Pinterest login…');
  await page.waitForSelector('[data-test-id="header-profile"], [aria-label="Account menu"]', { timeout: 0 });
  onStatus('Logged in to Pinterest.');
}

// Create a pin: image file + title + description + link + (optional) board.
async function createPin({ imagePath, title, description, link }, onStatus = () => {}) {
  onStatus('Opening pin builder…');
  await page.goto('https://www.pinterest.com/pin-builder/', { waitUntil: 'domcontentloaded' });
  // Upload image
  const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });
  await fileInput.setInputFiles(imagePath);
  onStatus('Image uploaded, filling fields…');
  await page.waitForTimeout(3000);

  // Title
  const titleSel = 'textarea[placeholder*="title" i], #pin-draft-title, [data-test-id="pin-draft-title"] textarea';
  const titleEl = await page.waitForSelector(titleSel, { timeout: 20000 });
  await titleEl.fill(title);

  // Description
  const descSel = '[data-test-id="pin-draft-description"] [contenteditable="true"], div[role="textbox"]';
  const descEl = await page.$(descSel);
  if (descEl) { await descEl.click(); await page.keyboard.type(description); }

  // Link
  const linkSel = 'textarea[placeholder*="link" i], #pin-draft-link, [data-test-id="pin-draft-link"] textarea';
  const linkEl = await page.$(linkSel);
  if (linkEl) await linkEl.fill(link);

  onStatus('Publishing pin…');
  const publishSel = '[data-test-id="board-dropdown-save-button"], button:has-text("Publish"), button:has-text("Save")';
  const pub = await page.waitForSelector(publishSel, { timeout: 20000 });
  await pub.click();
  await page.waitForTimeout(5000);
  onStatus('Pin published ✅');
}

async function close() { if (context) await context.close(); context = null; page = null; }

module.exports = { launch, isLoggedIn, waitForLogin, createPin, close };