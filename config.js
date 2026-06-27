// config.js — central settings
const path = require('path');
const os = require('os');

// Writable base dir (NEVER inside app.asar). Override with WO_HOME if needed.
const HOME = process.env.WO_HOME || path.join(os.homedir(), 'WallpaperOrchestrator');

module.exports = {
  // Base folder for all app data on the user's machine
  homeDir: HOME,

  // Where downloaded images are saved (writable!)
  outputDir: path.join(HOME, 'output'),

  // ChatGPT image generation page
  chatgptUrl: 'https://chatgpt.com/',

  // Link inserted into every Pinterest pin (your monetization page)
  pinterestLink: 'boosty.to/fallenowl',

  // Run browser visible (false) or headless (true)
  headless: false,

  // Pacing to avoid Pinterest spam protection (ms between pins)
  pinDelayMs: 90000,

  // --- CDP attach mode: reuse an already logged-in Chrome ---
  cdpUrl: process.env.CDP_URL || 'http://localhost:9222',
  cdpPort: Number(process.env.CDP_PORT) || 9222,
  chromeExe: process.env.CHROME_EXE ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  chromeProfileDir: process.env.CHROME_PROFILE_DIR ||
    path.join(process.env.LOCALAPPDATA || HOME, '.SaiChromeProfile'),

  // Playwright user-data dir for Pinterest (writable!)
  chatgptUserDataDir: path.join(HOME, '.chatgpt-profile'),
};
