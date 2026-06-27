// config.js — central settings
const path = require('path');
const os = require('os');

// Writable base dir for app data (logs, ledger). Override with WO_HOME.
const HOME = process.env.WO_HOME || path.join(os.homedir(), 'WallpaperOrchestrator');

// Root folder you drop finished images into (one subfolder per category).
const WATCH_ROOT = process.env.WO_WATCH_ROOT ||
  path.join(os.homedir(), 'Desktop', 'Pinterest');

module.exports = {
  homeDir: HOME,
  outputDir: path.join(HOME, 'output'),

  // --- Folder watching ---
  watchRoot: WATCH_ROOT,
  // Subfolders to watch. Each maps to its own category hashtags.
  categories: {
    Ads:      ['#ad', '#branding', '#productdesign', '#advertising'],
    Magazine: ['#editorial', '#magazine', '#fashion', '#cover'],
    Posters:  ['#poster', '#posterdesign', '#vintageposter', '#travelposter'],
    Art:      ['#art', '#digitalart', '#aiart', '#fineart'],
    Other:    ['#design', '#aesthetic', '#wallpaper'],
  },
  // Popular general Pinterest hashtags appended to EVERY pin.
  popularTags: ['#pinterest', '#inspiration', '#aesthetic', '#design',
                '#art', '#creative', '#moodboard', '#wallpaper', '#aiart', '#trending'],
  // Max hashtags per pin (Pinterest best practice ≈ 20).
  maxTags: 18,

  // Image file extensions to pick up.
  imageExts: ['.png', '.jpg', '.jpeg', '.webp'],

  // --- Pinterest ---
  pinterestLink: 'boosty.to/fallenowl',
  // Post each category to its own board (true) or all to default (false).
  boardPerCategory: true,

  // --- Scheduling ---
  // 'immediate' = post as soon as a file appears; 'schedule' = drip N/day.
  postMode: process.env.WO_MODE || 'schedule',
  postsPerDay: 8,            // used when postMode = 'schedule'
  pinDelayMs: 90000,         // min delay between pins (anti-spam)

  // Run browser visible (false) or headless (true)
  headless: false,
};
