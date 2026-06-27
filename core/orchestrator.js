// core/orchestrator.js
// Ties everything together: prompt -> ChatGPT image -> download -> Pinterest pin.
const promptEngine = require('./prompt_engine');
const chatgpt = require('./chatgpt_driver');
const pinterest = require('./pinterest_driver');
const config = require('../config');

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

// Run a single pin pipeline. uploadToPinterest=false lets us TEST stages 1-4 only.
async function runOnce({ customModelFn = null, uploadToPinterest = false } = {}, onStatus = () => {}) {
  // 1. prompt + meta
  const { prompt, object, background, meta } = await promptEngine.generate(customModelFn);
  onStatus('Prompt: ' + prompt);

  // 2-3. generate + download via ChatGPT
  await chatgpt.launch();
  if (!(await chatgpt.isLoggedIn())) await chatgpt.waitForLogin(onStatus);
  await chatgpt.sendPrompt(prompt, onStatus);
  const fileName = 'wp-' + slug(object) + '-' + Date.now() + '.png';
  const imagePath = await chatgpt.downloadImage(fileName, onStatus);

  // 4. meta already built
  onStatus('Title: ' + meta.title);
  onStatus('Description: ' + meta.description);
  onStatus('Alt: ' + meta.alt);

  // 5. upload (optional, off during testing)
  if (uploadToPinterest) {
    await pinterest.launch();
    if (!(await pinterest.isLoggedIn())) await pinterest.waitForLogin(onStatus);
    await pinterest.createPin({
      imagePath, title: meta.title, description: meta.description, link: config.pinterestLink,
    }, onStatus);
    await pinterest.close();
  } else {
    onStatus('uploadToPinterest=false → skipping pin upload (test mode).');
  }

  await chatgpt.close();
  return { prompt, imagePath, meta };
}

module.exports = { runOnce };