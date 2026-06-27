// config.js — central settings
const path = require('path');
const os = require('os');

const HOME = process.env.WO_HOME || path.join(os.homedir(), 'WallpaperOrchestrator');

// Desktop folder where you collect images (one subfolder per category).
const DESKTOP_ROOT = process.env.WO_DESKTOP_ROOT ||
  path.join(os.homedir(), 'Desktop', 'Pinterest');

module.exports = {
  homeDir: HOME,

  // --- Local source ---
  desktopRoot: DESKTOP_ROOT,
  categories: ['Ads', 'Magazine', 'Posters', 'Art', 'Other'],
  imageExts: ['.png', '.jpg', '.jpeg', '.webp'],

  // --- GitHub hosting (raw image URLs for Pinterest CSV) ---
  github: {
    owner: process.env.WO_GH_OWNER || 'egorlintos-spec',
    repo:  process.env.WO_GH_REPO  || 'wallpaper-orchestrator',
    branch: process.env.WO_GH_BRANCH || 'main',
    token: process.env.GITHUB_TOKEN || '',   // PAT with 'repo' scope (in .env)
    pinsDir: 'pins',
  },

  // --- Pin metadata ---
  pinterestLink: process.env.WO_LINK || 'https://boosty.to/fallenowl',
  maxTags: 18,
  categoryTags: {
    Ads:      ['#ad', '#branding', '#productdesign', '#advertising'],
    Magazine: ['#editorial', '#magazine', '#fashion', '#cover'],
    Posters:  ['#poster', '#posterdesign', '#vintageposter', '#travelposter'],
    Art:      ['#art', '#digitalart', '#aiart', '#fineart'],
    Other:    ['#design', '#aesthetic', '#wallpaper'],
  },
  popularTags: ['#pinterest', '#inspiration', '#aesthetic', '#design',
                '#art', '#creative', '#moodboard', '#wallpaper', '#aiart', '#trending'],

  // CSV output (saved into the desktop root)
  csvName: 'pinterest_upload.csv',
};
