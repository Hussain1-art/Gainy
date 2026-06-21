# Gainy

Fuel your goals — nutrition and activity tracking, built as an installable PWA.

## What changed in this rebuild

- **Stack**: plain Vite + vanilla JavaScript (no React, no Babel-in-browser). This was the fix for the blank-screen bug — Babel transpiling JSX live in iOS Safari was failing silently. Everything here is pre-built, modular JS that ships as plain `<script>` bundles.
- **No API key gate**: removed entirely. Barcode lookup now uses only the free, keyless Open Food Facts API.
- **3 bottom tabs**: Home (unchanged) · Progress (Fuel + Analytics merged, with a "Today's log" / "Trends" switcher inside) · Profile.
- **Simple auth**: local signup/login, no external auth provider yet (that's Phase 2).

## Project structure

```
gainy/
├── index.html              entry HTML
├── vite.config.js          build + PWA manifest config
├── vercel.json             Vercel deployment config
├── package.json
├── public/                 icons, favicon
└── src/
    ├── main.js              boot sequence
    ├── app.js                state + all action handlers ("controller")
    ├── lib/
    │   ├── constants.js       design tokens, food DB, activity types
    │   ├── storage.js         localStorage wrapper (swap for Supabase in Phase 2)
    │   ├── helpers.js         date/calorie math + barcode lookup
    │   ├── icons.js           inline SVG icon set
    │   └── ui.js              reusable render fragments (donut ring, calendar, chart)
    ├── screens/
    │   ├── auth.js            splash, signup/login, onboarding
    │   ├── home.js            Home tab
    │   ├── progress.js        Progress tab (log + trends sub-views)
    │   ├── search.js          food search + scan entry point
    │   ├── profile.js         Profile tab
    │   └── sheets.js          all modal sheets (add food, scanner, goals, etc.)
    └── styles/
        └── global.css
```

This is a **render-on-state-change** architecture: `state` is a single object, every user action mutates it then calls `render()`, which regenerates the relevant HTML strings and replaces `#app`'s innerHTML. No virtual DOM, no framework — simple and very hard to break across browsers.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL. To test on your phone over your home wifi, the dev server already binds to your network IP (`host: true` in vite.config.js) — Vite will print a `Network:` URL in the terminal, open that on your phone.

## Build

```bash
npm run build
npm run preview   # serve the production build locally to double check
```

Output goes to `dist/`.

---

## Phase 1 — Ship the PWA (you are here)

1. Push this folder to a GitHub repo.
2. Connect the repo to **Vercel** (or Cloudflare Pages / Netlify — `vercel.json` is included, but Vite's default output works on all three with zero config changes).
3. Vercel auto-detects Vite, runs `npm run build`, deploys `dist/`.
4. Share the `*.vercel.app` URL. Anyone can open it and tap "Add to Home Screen" — it installs like a real app, works offline after first load (service worker via `vite-plugin-pwa`), and the camera/barcode scanner works because it's served over HTTPS (a hard requirement for `getUserMedia`).

**Cost: $0/month.**

### Before you share with real users
- Replace the placeholder icons in `public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) with real Gainy artwork — current ones are solid-blue placeholders.
- Test the barcode scanner on an actual deployed HTTPS URL, not `localhost` — some browsers restrict camera access differently.

---

## Phase 2 — Add a backend (when friends start hitting "data disappears")

Swap **only** `src/lib/storage.js`. Every screen and the entire `app.js` controller calls `S.get/set/del` — none of them know or care where the data physically lives. That's the whole point of the abstraction.

**Recommended: Supabase** (Postgres + built-in Auth + generous free tier).

```
Frontend:       Gainy PWA (this repo, unchanged)
Backend:        Supabase
Database:       PostgreSQL
Authentication: Supabase Auth (replaces the current local-only signup/login in app.js `auth()`)
```

Steps:
1. Create a Supabase project, define a `user_data` table (`user_id`, `key`, `value jsonb`).
2. Create `src/lib/storage-supabase.js` implementing the same `{ get, set, del }` interface, backed by Supabase client calls.
3. Swap the import in `src/main.js` and `src/app.js` from `./lib/storage.js` to `./lib/storage-supabase.js`.
4. Replace the `auth()` function in `app.js` with `supabase.auth.signUp` / `signInWithPassword`.

No screen file needs to change.

---

## Phase 3 — Wrap as a native app (Capacitor)

You do not rebuild anything. Capacitor loads this exact web app inside a native iOS/Android shell.

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Gainy com.yourname.gainy
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

```
Gainy
│
├── HTML / CSS / JS   ← this repo, already built
│
└── Capacitor
      ├── ios/      (open in Xcode)
      └── android/  (open in Android Studio)
```

Once wrapped, you get native API access for Phase 5: Camera (already used via web `getUserMedia`, but Capacitor's Camera plugin gives more reliable native behavior), Push Notifications, HealthKit, Google Fit, biometrics.

---

## Phase 4 — App Store submission

**Apple**
- Mac + Xcode (free)
- Apple Developer Program — **$99/year**
- `npx cap open ios` → archive & submit via Xcode

**Google**
- Google Play Developer account — **$25 one-time**
- `npx cap open android` → build signed AAB → upload via Play Console

---

## Phase 5 — Native features (only after you have real users)

- **Apple Health / Google Fit / Health Connect** sync — read steps & active calories to auto-fill the Activity log.
- **Push notifications** — "Hey {name}, you have {X}g protein left today." Requires a backend (Phase 2) to schedule/send.
- **AI nutrition coach** — using meal history to suggest what to eat to hit remaining macros. This is a natural extension of the existing `lookupBarcode`-style API call pattern, calling an LLM with the day's remaining macros as context.

---

## Known limitations in this build (intentional, for Phase 1 speed)

- Barcode lookup only checks Open Food Facts. Very new or obscure products may not be listed — manual entry / photo fallback always available.
- History for brand-new accounts starts empty (no synthetic demo data), which is correct for real users but means a fresh signup's Trends chart looks sparse for the first week — by design.
- Auth is local-only (no password verification, no email confirmation) until Phase 2 lands Supabase Auth.
