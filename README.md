<h1 align="center">🪟 Wallpaper Orchestrator</h1>

<p align="center">
  <em>Auto-generate minimalist <b>"liquid glass"</b> iPhone wallpapers with the <b>Reve AI API</b> — and prepare them for Pinterest, end to end.</em>
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white">
  <img alt="Reve AI" src="https://img.shields.io/badge/Reve%20AI-image%20API-black">
  <img alt="Node" src="https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white">
</p>

---

## ✨ What it does

Wallpaper Orchestrator is a desktop app that runs a full content pipeline automatically:

```
  ┌──────────┐   ┌───────────────┐   ┌───────────┐   ┌────────────────────┐
  │  Prompt  │ → │   Reve AI     │ → │  Save to  │ → │ Pinterest pin +    │
  │  engine  │   │  image API    │   │   disk    │   │ boosty.to link     │
  └──────────┘   └───────────────┘   └───────────┘   └────────────────────┘
```

It produces signature wallpapers — a single translucent glass object (feather, hourglass, compass, crystal…) on a muted neutral background — and pins them with a description + your monetization link.

**No browser automation for image generation. No login, no captcha, no Cloudflare** — just one authenticated REST call to Reve.

## 📋 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [API key setup](#-api-key-setup)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [How prompts are written](#-how-prompts-are-written)
- [Roadmap](#-roadmap)
- [Disclaimer](#-disclaimer)
- [License](#-license)

## 🚀 Features

- 🎨 **Curated prompt engine** — 20+ hand-authored premium prompt pairs in a consistent aesthetic, plus a random generator and a pluggable hook for any LLM.
- 🤖 **Reve AI image generation** via a single REST call — fast, reliable, no browser.
- 🔑 **Just an API key** — no password, no 2FA, no session juggling. Key lives in `.env`.
- 📱 **9:16 by default** — sized for iPhone wallpapers (configurable aspect ratio).
- 💾 **Auto-save** of generated images to `output/`.
- 📌 **Pinterest-ready metadata** — every image gets a title, description and your `boosty.to/fallenowl` link.
- 🛡️ **Anti-spam pacing** — configurable delay between pins (default 90s).
- 🖥️ **Electron GUI** with "Test run" (prompt → image) and "Full run" (+Pinterest).

## 🧩 Requirements

- Windows 10/11
- [Node.js](https://nodejs.org) 18+
- A **Reve AI API key** with available budget
- Google Chrome *(only for the optional Pinterest upload step)*

## 📦 Installation

```bash
git clone https://github.com/egorlintos-spec/wallpaper-orchestrator.git
cd wallpaper-orchestrator
npm install
npm run install-browsers   # Playwright Chromium — only needed for Pinterest upload
npm start
```

## 🔑 API key setup

1. Copy `.env.example` to `.env`.
2. Paste your Reve API key:

   ```env
   REVE_API_KEY=papi.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxx
   ```

3. Make sure your Reve **API Budget** has funds (the app reports remaining credits after each generation).

> 🔒 `.env` is git-ignored. Never commit your real key. If a key ever leaks, rotate it in the Reve dashboard.

## ▶️ Usage

```bash
npm start
```

- **Test run** — prompt → Reve image → saved to `output/` (no Pinterest).
- **Full run** — same, then uploads the pin to Pinterest with your Boosty link.

## 📥 Downloads

Pre-built installers are produced automatically by GitHub Actions and attached to each [Release](https://github.com/egorlintos-spec/wallpaper-orchestrator/releases).

### Build it yourself

```bash
npm install
npm run dist:win     # or dist:mac / dist:linux
```

To cut a release that auto-builds all platforms, push a tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## ⚙️ Configuration

All settings live in [`config.js`](config.js) and can be overridden via `.env` (see [`.env.example`](.env.example)):

| Key | Default | Description |
|-----|---------|-------------|
| `reveApiKey` | *(from .env)* | Your Reve API key |
| `reveEndpoint` | `https://api.reve.com/v1/image/create` | Reve create endpoint |
| `reveVersion` | `latest` | Model version |
| `aspectRatio` | `9:16` | Image aspect ratio (iPhone wallpaper) |
| `outputDir` | `~/WallpaperOrchestrator/output` | Where wallpapers are saved |
| `pinterestLink` | `boosty.to/fallenowl` | Link added to every pin |
| `pinDelayMs` | `90000` | Delay between pins (anti-spam) |

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
    ├── reve_driver.js      # Reve AI image API (REST)
    ├── pinterest_driver.js # Pinterest pin upload (Playwright)
    └── orchestrator.js     # Ties the stages together
```

## 🧠 How prompts are written

The prompt engine supports three modes (see `core/prompt_engine.js`):

1. **Curated** (default) — a hand-authored bank of premium object×background×lighting combos.
2. **Random** — random pick from object/background lists.
3. **Custom model** — pass an `async` function to `generate()` to plug in any LLM.

Pin metadata (title, description, alt text, monetization link) is always attached automatically.

## 🗺️ Roadmap

- [ ] Batch generation (N wallpapers per run)
- [ ] Scheduler (5–10 pins/day to respect Pinterest limits)
- [ ] Optional LLM-driven prompt variety
- [ ] Post-processing presets (Reve postprocessors)

## ⚠️ Disclaimer

This project uses the Reve AI API for image generation and automates your own
Pinterest workflow. Respect the Terms of Service of Reve and Pinterest, and any
applicable rate limits. Use responsibly.

## 📄 License

[MIT](LICENSE) © FallenOWL
