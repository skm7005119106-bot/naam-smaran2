# Naam Smaran 🙏

A simple, beautiful, offline-first Naam Jap counter. Tap to chant, complete a
Mala every 108 Jap, track date-wise records, and unlock milestone
certificates - all stored on-device, with no login, no cloud, and no
network calls.

## What's inside

```
naam-smaran/
├── index.html              the whole app shell (splash, setup, 4 screens)
├── manifest.json           PWA install metadata
├── sw.js                   offline app-shell cache (browser/PWA installs)
├── css/
│   └── style.css           dark maroon + gold theme, layout, animations
├── js/
│   ├── state.js            pure data/business logic (counting, mala, milestones, records)
│   ├── audio.js             synthesized tap click + mala/milestone sounds (Web Audio, no audio files)
│   ├── certificate.js       canvas-drawn certificate + share/save
│   └── app.js               DOM wiring: screens, nav, taps, modals, celebrations
├── icons/
│   ├── generate_icon.py     regenerates the app icons (Pillow, no external assets)
│   └── icon-*.png
├── test/
│   └── state.test.js        43-assertion test suite for the core logic
└── package.json
```

`js/state.js` has no DOM code at all - it is pure logic, which is what makes
it unit-testable under plain Node and safe to trust for the counting/Mala/
milestone rules.

## Data & persistence

Everything is stored in a single `localStorage` key
(`naamSmaran.data.v1`) as one JSON object: user name, selected Naam, custom
Naam list, current tally, totals, date-wise records, Mala log, unlocked
milestones and certificates. `state.js`'s `migrate()` merges whatever was
saved onto a fresh default object, so an older or partially-written save
never crashes the app - missing fields just fall back to sensible
defaults. Nothing is ever synced anywhere; uninstalling the app is the only
thing that clears its data.

## Running it locally

Any static file server works, e.g.:

```bash
cd naam-smaran
python3 -m http.server 8080
# open http://localhost:8080
```

Opening `index.html` directly via `file://` also works for the app itself
(it only needs `localStorage`), but the service worker will not register
under `file://` - that's fine, it only pre-caches the shell for browser/PWA
installs and the app already ignores its absence gracefully.

## Running the tests

```bash
npm test
# or: node test/state.test.js
```

This exercises, with plain assertions: tap counting 1→107, the exact 108th
tap completing a Mala and resetting to 0, date-wise per-Naam records,
switching Naam mid-day, undo (and its limits), milestone unlocking exactly
once with a certificate per milestone, a full persistence round-trip
(simulating close + reopen), custom-Naam add/edit/delete with duplicate and
selection guards, and `migrate()` tolerating a partial/corrupted save.

## Building the Android APK from this GitHub repo

The app is plain HTML/CSS/JS with zero build step, so any of these work:

**Option A - Capacitor (recommended if you have Node + Android Studio):**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Naam Smaran" "com.yourname.naamsmaran" --web-dir="."
npx cap add android
npx cap sync
npx cap open android   # then Build > Build APK in Android Studio
```
Replace the generated `android/app/src/main/res/mipmap-*/ic_launcher.png`
files with exports of `icons/icon-512.png` for a matching launcher icon.

**Option B - PWA Builder / Trusted Web Activity:** host the folder anywhere
(GitHub Pages works well), then run it through
[pwabuilder.com](https://www.pwabuilder.com) to generate a signed Android
package from `manifest.json`.

**Option C - Plain WebView wrapper:** copy this whole folder into an Android
Studio project's `app/src/main/assets/www/` and point a `WebView` at
`file:///android_asset/www/index.html`, with
`settings.domStorageEnabled = true` (required for `localStorage`) and
JavaScript enabled. The service worker will not run in this mode - that's
expected, since `localStorage` alone already satisfies "never lost after
closing/restarting."

## Notes on scope

Per the brief, this intentionally has **no** login, cloud sync, ads, or
social features. Reaching a Mala mid-cycle also cannot be "undone" once it
rolls over to 0 - only in-progress taps within the current, still-open
cycle can be corrected, so a completed Mala record always stays accurate.
