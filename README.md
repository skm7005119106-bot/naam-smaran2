# Naam Smaran 🙏

Offline-first Naam Jap / Naam Smaran PWA.

## GitHub Pages structure

Upload the contents exactly as follows:

- `index.html`
- `manifest.json`
- `sw.js`
- `css/style.css`
- `js/app.js`
- `js/state.js`
- `js/audio.js`
- `js/certificate.js`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/icon-512-maskable.png`

## Important for a browser-free installed experience

`manifest.json` uses `display: standalone` and `display_override` so an installed PWA can open without the normal Chrome address bar. The browser address bar cannot be hidden by HTML/CSS when the URL is opened as a normal browser tab.

If an Android APK/TWA still shows the Chrome address bar, the Android wrapper needs a valid Digital Asset Links (`/.well-known/assetlinks.json`) entry matching its package name and signing certificate SHA-256 fingerprint. That value is specific to the APK signing key and must not be guessed.

## Offline

All app code and icons are local. No external CDN, web font, analytics, or API is used.
