// config.js — central settings
const path = require('path');
const os = require('os');
require('dotenv').config();

module.exports = {
  // GitHub repo used as a TEMPORARY public host for images (raw URLs for Pinterest).
  github: {
    owner:  process.env.GITHUB_OWNER  || 'egorlintos-spec',
    repo:   process.env.GITHUB_REPO   || 'wallpaper-orchestrator',
    branch: process.env.GITHUB_BRANCH || 'main',
    token:  process.env.GITHUB_TOKEN  || '',   // PAT with "repo" scope
  },

  // Root folder on the user's machine that contains the category subfolders.
  // Relative paths are resolved against the home directory.
  watchRoot: process.env.WATCH_ROOT || path.join('Desktop', 'Pinterest'),
  categories: ['Ads', 'Magazine', 'Posters', 'Art', 'Other'],

  // Monetization link added to every pin.
  pinterestLink: process.env.BOOSTY_LINK || 'https://boosty.to/fallenowl',

  // Tags appended per category (folder = board name).
  categoryTags: {
    Ads:      ['#ad', '#advertising', '#branding', '#productdesign', '#commercial'],
    Magazine: ['#magazine', '#editorial', '#fashion', '#cover', '#photography'],
    Posters:  ['#poster', '#posterdesign', '#graphicdesign', '#typography', '#print'],
    Art:      ['#art', '#fineart', '#illustration', '#contemporaryart', '#artwork'],
    Other:    ['#design', '#aesthetic', '#inspiration', '#minimal', '#creative'],
  },
  // Popular general tags appended to every pin (for reach).
  popularTags: ['#pinterest', '#aesthetic', '#wallpaper', '#design', '#inspo', '#moodboard', '#visual', '#trending'],
  maxTags: 18,
};
