# Build resources

Place app icons here (optional — electron-builder uses defaults if missing):

- `icon.ico`  — Windows (256x256 multi-size)
- `icon.icns` — macOS
- `icon.png`  — Linux (512x512)

You can generate all three from a single 1024x1024 PNG with tools like
[electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder):

```bash
npx electron-icon-builder --input=logo.png --output=build
```
