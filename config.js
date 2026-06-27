// config.js — central settings
const path = require('path');

module.exports = {
  // Where downloaded images are saved
  outputDir: path.join(__dirname, 'output'),

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
    path.join(process.env.LOCALAPPDATA || __dirname, '.SaiChromeProfile'),

  // Playwright user-data dir for Pinterest (persists login)
  chatgptUserDataDir: path.join(__dirname, '.chatgpt-profile'),
};
