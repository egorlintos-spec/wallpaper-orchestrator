<h1 align="center">🪟 Wallpaper Orchestrator</h1>

<p align="center">
  <em>Auto-generate minimalist <b>"liquid glass"</b> iPhone wallpapers with ChatGPT — and prepare them for Pinterest, end to end.</em>
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-1.45-2EAD33?logo=playwright&logoColor=white">
  <img alt="Node" src="https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white">
</p>

---

## ✨ What it does

Wallpaper Orchestrator is a desktop app that runs a full content pipeline automatically:

```
  ┌──────────┐   ┌───────────────┐   ┌───────────┐   ┌────────────────────┐
  │  Prompt  │ → │ ChatGPT image │ → │  Download │ → │ Pinterest pin +    │
  │  engine  │   │  generation   │   │   to disk │   │ boosty.to link     │
  └──────────┘   └───────────────┘   └───────────┘   └────────────────────┘
```

It produces signature wallpapers — a single translucent glass object (feather, hourglass, compass, crystal…) on a muted neutral background — and pins them with a description + your monetization link.

## 📋 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [ChatGPT login (one-time)](#-chatgpt-login-one-time)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [How prompts are written](#-how-prompts-are-written)
- [Roadmap](#-roadmap)
- [Disclaimer](#-disclaimer)
- [License](#-license)

## 🚀 Features

- 🎨 **Curated prompt engine** — 20+ hand-authored premium prompt pairs in a consistent aesthetic, plus a random generator and a pluggable hook for any LLM.
- 🤖 **ChatGPT automation** via Playwright — no API key needed for images.
- 🔐 **Sessionless login** — attaches to an already logged-in Chrome over CDP, so **no password or 2FA is stored** by the app.
- 💾 **Auto-download** of generated images to `output/`.
- 📌 **Pinterest-ready metadata** — every image gets a title, description and your `boosty.to/fallenowl` link.
- 🛡️ **Anti-spam pacing** — configurable delay between pins (default 90s).
- 🖥️ **Electron GUI** with "Test run" (stages 1–4) and "Full run" (+Pinterest).

## 🧩 Requirements

- Windows 10/11
- [Node.js](https://nodejs.org) 18+
- Google Chrome

## 📦 Installation

```bash
git clone https://github.com/egorlintos-spec/wallpaper-orchestrator.git
cd wallpaper-orchestrator
npm install
npm run install-browsers   # downloads Playwright Chromium
npm start
```

## 🔐 ChatGPT login (one-time)

The app never stores your password. Instead it reuses a live ChatGPT session
from a Chrome instance started with remote debugging:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="$env:LOCALAPPDATA\.SaiChromeProfile"
```

1. In that Chrome window, sign in once at <https://chatgpt.com>.
2. Leave it running. The app connects to it automatically.

> If Chrome isn't running, the driver will launch it with the right flags for you.

## ▶️ Usage

**GUI**

```bash
npm start
```

**Headless test (no GUI)**

```bash
npm run test:prompt   # prints a generated prompt + pin metadata
npm run test:full     # prompt → ChatGPT → download into output/
```

## ⚙️ Configuration

All settings live in [`config.js`](config.js) and can be overridden via `.env` (see [`.env.example`](.env.example)):

| Key | Default | Description |
|-----|---------|-------------|
| `outputDir` | `./output` | Where wallpapers are saved |
| `pinterestLink` | `boosty.to/fallenowl` | Link added to every pin |
| `pinDelayMs` | `90000` | Delay between pins (anti-spam) |
| `cdpUrl` / `cdpPort` | `http://localhost:9222` | Chrome remote-debugging endpoint |
| `chromeExe` | Chrome default path | Path to Chrome executable |
| `chromeProfileDir` | `%LOCALAPPDATA%\.SaiChromeProfile` | Chrome profile holding your session |

## 🏗️ Architecture

```
wallpaper-orchestrator/
├── main.js                 # Electron main process
├── preload.js              # Secure IPC bridge
├── config.js               # Central settings
├── gui/
│   ├── index.html          # App window
│   └── renderer.js         # UI logic
└── core/
    ├── prompt_engine.js    # Prompt generation (template + curated + hook)
    ├── chatgpt_driver.js   # ChatGPT automation over CDP/Playwright
    ├── pinterest_driver.js # Pinterest pin upload
    └── orchestrator.js     # Ties the stages together
```

## 🧠 How prompts are written

The prompt engine supports three modes (see `core/prompt_engine.js`):

1. **Curated** (default) — a hand-authored bank of premium object×background×lighting combos.
2. **Random** — random pick from object/background lists.
3. **Custom model** — pass an `async` function to `generate()` to plug in any LLM (OpenAI API, Ollama, or ChatGPT itself).

```js
const pe = require('./core/prompt_engine');

// curated (default)
const p = await pe.generate();

// plug your own model
const p2 = await pe.generate(async ({ composePrompt }) => {
  const object = 'a glass paper plane';
  const background = 'warm cream beige';
  return { prompt: composePrompt(object, background, 'soft side light'), object, background };
});
```

Pin metadata (title, description, alt text, monetization link) is always attached automatically.

## 🗺️ Roadmap

- [ ] Batch generation (N wallpapers per run)
- [ ] Scheduler (5–10 pins/day to respect Pinterest limits)
- [ ] Optional LLM-driven prompt variety
- [ ] Cross-platform (macOS/Linux) Chrome paths

## ⚠️ Disclaimer

This project automates your own logged-in sessions for personal content workflows.
Respect the Terms of Service of ChatGPT/OpenAI and Pinterest, and any applicable
rate limits. Use responsibly.

## 📄 License

[MIT](LICENSE) © FallenOWL
