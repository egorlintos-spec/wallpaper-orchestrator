// core/pinterest_driver.js
// Uploads a pin to Pinterest via Playwright UI automation (no API needed).
// Reuses a persistent profile so you stay logged in.
const { chromium } = require('playwright');
const path = require('path');
const config = require('../config');

let context = null, page = null;
const PROFILE = path.join(config.homeDir, '.pinterest-profile');

async function launch() {
  if (context) return page;
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
  onStatus('⚠️ Please log in to Pinterest in the opened window…');
  await page.bringToFront().catch(() => {});
  await page.waitForSelector('[data-test-id="header-profile"], [aria-label="Account menu"]', { timeout: 0 });
  onStatus('✅ Logged in to Pinterest.');
}

// Best-effort: pick (or create) a board by name in the pin builder.
async function selectBoard(boardName, onStatus = () => {}) {
  if (!boardName) return;
  try {
    const dd = await page.waitForSelector('[data-test-id="board-dropdown-select-button"], button:has-text("Choose a board")', { timeout: 8000 });
    await dd.click();
    await page.waitForTimeout(800);
    const search = await page.$('input[placeholder*="Search" i]');
    if (search) { await search.fill(boardName); await page.waitForTimeout(1000); }
    // try existing board row first, else create it
    const row = await page.$('[data-test-id="board-row"]:has-text("' + boardName + '"), div[role="button"]:has-text("' + boardName + '")');
    if (row) { await row.click(); onStatus('Board: ' + boardName); }
    else {
      const create = await page.$('button:has-text("Create"), [data-test-id="board-picker-create-board"]');
      if (create) { await create.click(); await page.waitForTimeout(800);
        const nameInput = await page.$('input[id*="board" i], input[placeholder*="name" i]');
        if (nameInput) { await nameInput.fill(boardName); }
        const done = await page.$('button:has-text("Create"), button:has-text("Done")');
        if (done) await done.click();
        onStatus('Created board: ' + boardName);
      }
    }
    await page.waitForTimeout(800);
  } catch (e) { onStatus('Board select skipped (' + e.message + ')'); }
}

// Create a pin: image file + title + description + link + (optional) board.
async function createPin({ imagePath, title, description, link, board }, onStatus = () => {}) {
  onStatus('Opening pin builder…');
  await page.goto('https://www.pinterest.com/pin-builder/', { waitUntil: 'domcontentloaded' });
  const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });
  await fileInput.setInputFiles(imagePath);
  onStatus('Image uploaded, filling fields…');
  await page.waitForTimeout(3000);

  const titleSel = 'textarea[placeholder*="title" i], #pin-draft-title, [data-test-id="pin-draft-title"] textarea';
  const titleEl = await page.waitForSelector(titleSel, { timeout: 20000 });
  await titleEl.fill(title);

  const descSel = '[data-test-id="pin-draft-description"] [contenteditable="true"], div[role="textbox"]';
  const descEl = await page.$(descSel);
  if (descEl) { await descEl.click(); await page.keyboard.type(description); }

  const linkSel = 'textarea[placeholder*="link" i], #pin-draft-link, [data-test-id="pin-draft-link"] textarea';
  const linkEl = await page.$(linkSel);
  if (linkEl) await linkEl.fill(link);

  if (board) await selectBoard(board, onStatus);

  onStatus('Publishing pin…');
  const publishSel = '[data-test-id="board-dropdown-save-button"], button:has-text("Publish"), button:has-text("Save")';
  const pub = await page.waitForSelector(publishSel, { timeout: 20000 });
  await pub.click();
  await page.waitForTimeout(5000);
  onStatus('Pin published ✅');
}

async function close() { if (context) await context.close(); context = null; page = null; }

module.exports = { launch, isLoggedIn, waitForLogin, createPin, close };
