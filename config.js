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

  // --- Reve AI image API ---
  reveEndpoint: process.env.REVE_ENDPOINT || 'https://api.reve.com/v1/image/create',
  reveApiKey: process.env.REVE_API_KEY || '',
  reveVersion: process.env.REVE_VERSION || 'latest',
  aspectRatio: process.env.WO_ASPECT || '9:16', // iPhone wallpaper

  // Link inserted into every Pinterest pin (your monetization page)
  pinterestLink: 'boosty.to/fallenowl',

  // Run browser visible (false) or headless (true)
  headless: false,

  // Pacing to avoid Pinterest spam protection (ms between pins)
  pinDelayMs: 90000,

};
