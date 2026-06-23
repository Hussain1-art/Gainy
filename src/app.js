import { C } from './lib/constants.js';
import { ic, SVG } from './lib/icons.js';
import { S } from './lib/storage.js';
import {
  dKey, calcTargets, emptyLog, fixLog, sumLog, autoCat, lookupBarcode,
  searchFoods, hashPassword, upsertWeight,
} from './lib/helpers.js';
import { renderSuccess } from './screens/success.js';
import { DEF_CATS, DEF_ROUTINE, FOODS, ACTS } from './lib/constants.js';
import { renderSplash, renderAuth, renderOnboard } from './screens/auth.js';
import { renderHome } from './screens/home.js';
import { renderProgress } from './screens/progress.js';
import { renderSearch } from './screens/search.js';
import { renderProfile } from './screens/profile.js';
import { renderSheet } from './screens/sheets.js';

// ─── STATE ────────────────────────────────────────────────────────────────
export const state = {
  stage: 'loading', // loading | auth | onboard | app
  tab: 'home', // home | progress | search | profile  (search reached via quick-add, not a bottom tab)
  user: null,
  cats: DEF_CATS.slice(),
  routine: DEF_ROUTINE.slice(),
  log: null,
  cache: {},
  wOff: 0,
  selDate: dKey(0),
  selCat: 'breakfast',
  sheet: null,
  sheetData: {},
  loginErr: '',
  onboard: { step: 0, goal: 'lose', sex: 'm', age: 28, height: 175, weight: 75, tWeight: 70, actLvl: 'mod' },
  scanner: { status: 'idle', found: null, manual: '', err: '' },
  search: { q: '', results: [], status: 'idle', error: '' },
  streak: 0,
  success: null, // { name, mealId, mealLabel } — drives the celebration takeover
  _scanReader: null,
};

// Debounce timer for the food-name search (module-scoped, not part of state).
let _searchTimer = null;

// ─── RENDER ───────────────────────────────────────────────────────────────
// Public render() is a safety wrapper: if any screen builder throws, we show
// a recoverable error card instead of leaving #app blank (white screen).
export function render() {
  try {
    _render();
  } catch (e) {
    console.error('Render failed:', e);
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = `<div class="shell"><div class="screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px">
<div style="font-size:40px">⚠️</div>
<div style="font-size:18px;font-weight:800;color:${C.ink}">Something went wrong</div>
<div style="font-size:13px;color:${C.sub};max-width:280px">The app hit an unexpected error. Your saved data is safe — reload to continue.</div>
<button onclick="location.reload()" class="btn" style="background:${C.blue};color:#fff;max-width:200px;margin-top:8px">Reload Gainy</button>
</div></div>`;
    }
  }
}

function _render() {
  const root = document.getElementById('app');
  if (!root) return;

  if (state.stage === 'loading') { root.innerHTML = `<div class="shell">${renderSplash()}</div>`; return; }
  if (state.stage === 'auth') { root.innerHTML = `<div class="shell">${renderAuth(state)}</div>`; return; }
  if (state.stage === 'onboard') { root.innerHTML = `<div class="shell">${renderOnboard(state)}</div>`; return; }

  if (state.stage === 'app') {
    // While the camera is actively scanning, do NOT touch the DOM at all.
    // Re-rendering would destroy and recreate <video>, killing the live
    // stream + decode loop bound to it. The manual-entry input inside the
    // scanner sheet updates state.scanner.manual directly without
    // triggering render(), so this guard is safe.
    if (state.sheet === 'scanner' && state.scanner.status === 'scanning' && state._scanWired) {
      return;
    }

    let screenHTML = '';
    if (state.tab === 'home') screenHTML = renderHome(state);
    else if (state.tab === 'progress') screenHTML = renderProgress(state);
    else if (state.tab === 'search') screenHTML = renderSearch(state);
    else if (state.tab === 'profile') screenHTML = renderProfile(state);

    const tabs = [
      { id: 'home', svg: SVG.home, label: 'Home' },
      { id: 'progress', svg: SVG.progress, label: 'Progress' },
      { id: 'profile', svg: SVG.user, label: 'Profile' },
    ];
    const navTab = state.tab === 'search' ? 'progress' : state.tab; // search has no own nav dot
    const nav = tabs.map(t => `<button class="nav-btn ${navTab === t.id ? 'active' : ''}" onclick="app.tab('${t.id}')" style="color:${navTab === t.id ? C.blue : C.sub}">
${t.svg}<span>${t.label}</span></button>`).join('');

    const sheetHTML = state.sheet ? renderSheet(state) : '';
    const successHTML = state.success ? `<div class="takeover">${renderSuccess(state)}</div>` : '';

    root.innerHTML = `<div class="shell">
<div class="screen">${screenHTML}</div>
<nav class="nav">${nav}</nav>
${sheetHTML}
${successHTML}
</div>`;

    // Attach video stream + wire the decode loop exactly once per scan session.
    if (state.sheet === 'scanner' && state.scanner.status === 'scanning' && state._pendingStream && !state._scanWired) {
      const v = document.getElementById('scan-video');
      if (v) {
        state._scanWired = true; // set BEFORE the async wire call so no duplicate wiring can race in
        v.srcObject = state._pendingStream;
        v.play().catch(() => {});
        app._wireScanLoop(v);
      }
    }
  }
}

// ─── APP CONTROLLER (exposed globally for inline onclick handlers) ───────
export const app = {
  tab(t) { state.tab = t; state.sheet = null; render(); },
  sheet(name, catId) {
    if (state.sheet === 'scanner') app.stopScanner();
    state.sheet = name; state.sheetData = {};
    if (catId) state.sheetData.catId = catId;
    if (name === 'scanner') {
      state.scanner = { status: 'starting', found: null, manual: '', err: '' };
      render();
      app.startScanner();
    } else {
      render();
    }
  },
  closeSheet() {
    if (state.sheet === 'scanner') app.stopScanner();
    state.sheet = null; render();
  },
  selDate(k) { state.selDate = k; render(); },
  wOff(d) { state.wOff += d; render(); },
  selCat(id) { state.selCat = id; render(); },
  selCatIdx(i) { const c = state.cats[i]; if (c) { state.selCat = c.id; render(); } },
  goToday() { state.selDate = dKey(0); state.wOff = 0; render(); },
  inspect(i) { state.sheetData.inspected = i; render(); },
  authMode(m) { state.sheetData.authMode = m; render(); },

  // ── Auth (local signup/login — multiple accounts, hashed passwords) ──
  // Accounts live in the `users` map keyed by lowercased email. The active
  // session is mirrored into `user` for fast boot resume in main.js.
  async auth() {
    const mode = state.sheetData.authMode || 'signup';
    const name = (document.getElementById('au-name')?.value || '').trim();
    const email = (document.getElementById('au-email')?.value || '').trim();
    const pw = (document.getElementById('au-pw')?.value || '').trim();
    const key = email.toLowerCase();
    const users = S.get('users') || {};

    if (mode === 'signup') {
      if (!name) { state.loginErr = 'Please enter your name.'; render(); return; }
      if (!email) { state.loginErr = 'Please enter an email.'; render(); return; }
      if (pw.length < 4) { state.loginErr = 'Password must be at least 4 characters.'; render(); return; }
      if (users[key]) { state.loginErr = 'An account with that email already exists — log in instead.'; render(); return; }
      let pwHash;
      try { pwHash = await hashPassword(pw); }
      catch (e) { state.loginErr = "Couldn't secure your password on this device. Try again."; render(); return; }
      // Carry the hash through onboarding; the full account is written once
      // onboarding completes, so a half-finished signup can't overwrite anything.
      state.user = { name, email, pw: pwHash, _pending: true };
      state.loginErr = '';
      state.stage = 'onboard';
      render();
      return;
    }

    // login
    if (!email) { state.loginErr = 'Please enter your email.'; render(); return; }
    if (!pw) { state.loginErr = 'Please enter your password.'; render(); return; }
    const acct = users[key];
    if (!acct) { state.loginErr = 'No account found with that email — try Sign up.'; render(); return; }
    let pwHash;
    try { pwHash = await hashPassword(pw); }
    catch (e) { state.loginErr = "Couldn't verify your password on this device. Try again."; render(); return; }
    if (acct.pw !== pwHash) { state.loginErr = 'Incorrect password.'; render(); return; }
    state.user = { reminders: {}, ...acct };
    state.loginErr = '';
    app._loadToday();
    state.stage = 'app';
    render();
  },
  // Persist the active user to both the session slot and the accounts map so
  // profile/goal/weight edits survive a logout → login round-trip.
  _persistUser() {
    if (!state.user) return;
    S.set('user', state.user);
    if (state.user.email) {
      const users = S.get('users') || {};
      users[state.user.email.toLowerCase()] = state.user;
      S.set('users', users);
    }
  },
  logout() { state.stage = 'auth'; state.loginErr = ''; state.sheet = null; render(); },
  reset() {
    const key = state.user?.email?.toLowerCase();
    S.del('user'); S.del('cats'); S.del('routine'); S.del('log:' + dKey(0));
    for (let o = -6; o < 0; o++) S.del('sum:' + dKey(o));
    if (key) {
      const users = S.get('users') || {};
      delete users[key];
      S.set('users', users);
    }
    state.user = null; state.log = null; state.cache = {};
    state.cats = DEF_CATS.slice(); state.routine = DEF_ROUTINE.slice();
    state.selDate = dKey(0); state.wOff = 0;
    state.stage = 'auth'; state.sheet = null; render();
  },

  // ── Onboarding ──
  ob(key, val) { state.onboard[key] = val; render(); },
  obN(key, delta) { state.onboard[key] = Math.round((state.onboard[key] + delta) * 10) / 10; render(); },
  obStep(d) {
    const step = state.onboard.step + d;
    if (step < 0) return;
    if (step > 2) {
      const o = state.onboard;
      const targets = calcTargets({ age: o.age, sex: o.sex, height: o.height, weight: o.weight, actLvl: o.actLvl, goal: o.goal });
      const u = {
        name: state.user.name, email: state.user.email, pw: state.user.pw,
        goal: o.goal, sex: o.sex, age: o.age, height: o.height,
        weight: o.weight, tWeight: o.tWeight, startWeight: o.weight, actLvl: o.actLvl,
        weightLog: [{ d: dKey(0), kg: o.weight }],
        targets, reminders: { breakfast: true, lunch: true, dinner: true, water: false },
      };
      state.user = u; app._persistUser();
      app._loadToday();
      state.stage = 'app'; render();
      return;
    }
    state.onboard.step = step; render();
  },

  // ── Log persistence ──
  _loadToday() {
    const cats = S.get('cats') || DEF_CATS; state.cats = cats;
    const r = S.get('routine'); if (r) state.routine = r;
    const saved = S.get('log:' + dKey(0));
    state.log = saved ? fixLog(saved, cats) : emptyLog(cats);
    state.selCat = autoCat(cats);
    app._loadHistory();
    app._computeStreak();
  },
  _saveToday() {
    S.set('log:' + dKey(0), state.log);
    const s = sumLog(state.log);
    state.cache[dKey(0)] = s; S.set('sum:' + dKey(0), s);
    app._computeStreak();
  },
  // Current logging streak: consecutive days (back from today) with any food
  // logged. An empty in-progress "today" doesn't break the streak — we start
  // counting at yesterday in that case.
  _computeStreak() {
    const today = sumLog(state.log);
    let streak = 0;
    let off = today.cal > 0 ? 0 : -1;
    for (; off > -180; off--) {
      const k = dKey(off);
      const s = off === 0 ? today : (state.cache[k] || S.get('sum:' + k));
      if (s && s.cal > 0) streak++; else break;
    }
    state.streak = streak;
  },
  _loadHistory() {
    for (let o = -6; o <= 0; o++) {
      const k = dKey(o);
      if (k === dKey(0)) { state.cache[k] = sumLog(state.log); continue; }
      if (k in state.cache) continue;
      const saved = S.get('sum:' + k);
      if (saved) { state.cache[k] = saved; continue; }
      // No history yet for a brand-new account — show zeros rather than fake data
      state.cache[k] = { cal: 0, pro: 0, carb: 0, fat: 0 };
    }
  },

  // ── Food search (Open Food Facts by name, local foods as fallback) ──
  _localMatches(q) {
    const s = q.toLowerCase();
    return FOODS.filter(f => f.name.toLowerCase().includes(s) || (f.brand || '').toLowerCase().includes(s));
  },
  onSearchInput(q) {
    state.search.q = q;
    if (_searchTimer) clearTimeout(_searchTimer);
    // Debounce so we don't fire a network request on every keystroke (and so
    // the input keeps focus while typing — render only happens after a pause).
    _searchTimer = setTimeout(() => app.runSearch(q), 350);
  },
  async runSearch(q) {
    if (q !== state.search.q) return; // a newer keystroke superseded this one
    if (!q.trim()) { state.search = { q: '', results: [], status: 'idle', error: '' }; render(); return; }
    const local = app._localMatches(q);
    state.search.status = 'loading';
    state.search.results = local; // show local hits immediately while the API loads
    state.search.error = '';
    render();
    try {
      const api = await searchFoods(q);
      if (q !== state.search.q) return; // stale response, ignore
      // Local foods first (curated), then API results.
      state.search.results = [...local, ...api];
      state.search.status = 'done';
      state.search.error = '';
    } catch (e) {
      if (q !== state.search.q) return;
      // API unreachable — fall back to local matches only.
      state.search.results = local;
      state.search.status = 'error';
      state.search.error = "Couldn't reach the food database — showing local foods only.";
    }
    render();
  },
  pickSearchResult(i) {
    const q = state.search.q.trim();
    const list = q ? state.search.results : FOODS;
    const f = list[i]; if (!f) return;
    state.sheet = 'addfood'; state.sheetData = { food: f, servings: 1, meal: autoCat(state.cats) };
    render();
  },

  // ── Manual food entry (when nothing is found) ──
  saveManualFood() {
    const sd = state.sheetData;
    const name = (sd.mfName || '').trim();
    const cal = Number(sd.mfCal);
    if (!name) { sd.mfErr = 'Please enter a food name.'; render(); return; }
    if (!Number.isFinite(cal) || cal <= 0) { sd.mfErr = 'Please enter calories (a number above 0).'; render(); return; }
    const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0; };
    const food = {
      id: 'man-' + Date.now(),
      name, brand: '', serving: '1 serving',
      cal: Math.round(cal), pro: num(sd.mfPro), carb: num(sd.mfCarb), fat: num(sd.mfFat),
    };
    // Route through the normal add-food sheet so servings/meal selection and
    // logging work exactly like a search or barcode result.
    state.sheet = 'addfood';
    state.sheetData = { food, servings: 1, meal: autoCat(state.cats) };
    render();
  },
  goAddFood(catId) { state.sheet = null; state.sheetData = {}; state.selCat = catId; state.tab = 'search'; render(); },
  editFood(catId, itemId) {
    const item = state.log.meals[catId]?.find(i => i.id === itemId); if (!item) return;
    state.sheet = 'addfood';
    state.sheetData = { food: item.baseFood || item, servings: item.servings || 1, meal: catId, existing: { id: itemId, meal: catId } };
    render();
  },
  afSrv(delta) { const s = Math.max(0.5, Math.round((state.sheetData.servings + delta) * 2) / 2); state.sheetData.servings = s; render(); },
  saveFood() {
    const sd = state.sheetData; const f = sd.food; const srv = sd.servings || 1; const meal = sd.meal || state.selCat;
    const entry = {
      id: sd.existing ? sd.existing.id : Date.now() + '-' + f.id,
      name: f.name, brand: f.brand || '', serving: srv + '×' + f.serving, servings: srv, baseFood: f,
      cal: Math.round(f.cal * srv), pro: Math.round(f.pro * srv * 10) / 10,
      carb: Math.round(f.carb * srv * 10) / 10, fat: Math.round(f.fat * srv * 10) / 10,
    };
    const isEdit = !!sd.existing;
    if (sd.existing) {
      const om = sd.existing.meal;
      state.log.meals[om] = state.log.meals[om].filter(i => i.id !== sd.existing.id);
    }
    if (!state.log.meals[meal]) state.log.meals[meal] = [];
    state.log.meals[meal].push(entry);
    app._saveToday(); state.sheet = null; state.sheetData = {}; state.selCat = meal;
    if (isEdit) { state.tab = 'progress'; render(); }
    else app._celebrate(entry.name, meal); // new addition → celebration moment
  },
  removeFood() {
    const sd = state.sheetData; if (!sd.existing) return;
    state.log.meals[sd.existing.meal] = state.log.meals[sd.existing.meal].filter(i => i.id !== sd.existing.id);
    app._saveToday(); state.sheet = null; render();
  },

  // ── Water / routine / activity ──
  logWater() { state.log.water++; app._saveToday(); if (state.sheet === 'quickadd') state.sheet = null; render(); },
  toggleRoutine(rid) {
    const r = state.routine.find(x => x.id === rid); if (!r) return;
    if (r.type === 'water') { app.logWater(); return; }
    if (r.type === 'meal') {
      const cat = state.cats.find(c => c.id === r.mid);
      if (cat) { state.selCat = cat.id; state.tab = 'progress'; state.sheet = null; render(); }
      return;
    }
    state.log.done[rid] = !state.log.done[rid]; app._saveToday(); render();
  },
  toggleReminder(id) {
    if (!state.user.reminders) state.user.reminders = {};
    state.user.reminders[id] = !state.user.reminders[id];
    app._persistUser(); render();
  },
  saveActivity() {
    const sd = state.sheetData; const act = ACTS.find(a => a.id === sd.actPicked); if (!act) return;
    const mins = sd.actMinutes || 20;
    const entry = { id: Date.now(), name: act.name, minutes: mins, cal: Math.round(act.met * state.user.weight * (mins / 60)) };
    state.log.acts.push(entry);
    app._saveToday(); state.sheet = null; render();
  },

  // ── Categories ──
  saveNewCat() {
    const sd = state.sheetData; const label = (sd.newLabel || '').trim(); if (!label) return;
    const cat = { id: 'cat-' + Date.now(), label, icon: sd.newIcon || '🍽️' };
    state.cats.push(cat); S.set('cats', state.cats);
    if (!state.log.meals[cat.id]) state.log.meals[cat.id] = [];
    app._saveToday(); state.selCat = cat.id; state.sheet = null; render();
  },
  saveCatEdit() {
    const sd = state.sheetData; const cat = state.cats.find(c => c.id === sd.catId); if (!cat) return;
    if (sd.editLabel !== undefined) cat.label = sd.editLabel.trim();
    if (sd.editIcon !== undefined) cat.icon = sd.editIcon;
    S.set('cats', state.cats); state.sheet = null; render();
  },
  deleteCat(id) {
    if (state.cats.length <= 1) return;
    state.cats = state.cats.filter(c => c.id !== id);
    S.set('cats', state.cats);
    delete state.log.meals[id]; app._saveToday();
    state.selCat = state.cats[0].id; state.sheet = null; render();
  },

  // ── Routine ──
  saveNewRoutine() {
    const sd = state.sheetData; const label = (sd.newLabel || '').trim(); if (!label) return;
    state.routine.push({ id: 'rt-' + Date.now(), label, type: 'custom', icon: sd.newIcon || '✅' });
    S.set('routine', state.routine); state.sheet = null; render();
  },

  // ── Goals / weight ──
  gAdj(key, delta) {
    const map = { gcal: 'cal', gpro: 'pro', gcarb: 'carb', gfat: 'fat' };
    const cur = state.sheetData[key] !== undefined ? state.sheetData[key] : state.user.targets[map[key]];
    state.sheetData[key] = Math.max(0, cur + delta); render();
  },
  saveGoal() {
    const sd = state.sheetData; const t = state.user.targets;
    state.user.targets = {
      cal: sd.gcal !== undefined ? sd.gcal : t.cal,
      pro: sd.gpro !== undefined ? sd.gpro : t.pro,
      carb: sd.gcarb !== undefined ? sd.gcarb : t.carb,
      fat: sd.gfat !== undefined ? sd.gfat : t.fat,
      water: t.water,
    };
    app._persistUser(); state.sheet = null; render();
  },
  wAdj(d) {
    const cur = state.sheetData.newW !== undefined ? state.sheetData.newW : state.user.weight;
    state.sheetData.newW = Math.max(35, Math.round((cur + d) * 10) / 10); render();
  },
  saveWeight() {
    const w = state.sheetData.newW !== undefined ? state.sheetData.newW : state.user.weight;
    state.user.weight = w;
    state.user.weightLog = upsertWeight(state.user.weightLog, dKey(0), w);
    if (state.user.startWeight === undefined) state.user.startWeight = w;
    app._persistUser(); state.sheet = null; render();
  },
  epAdj(key, delta) {
    const cur = state.sheetData[key] !== undefined ? state.sheetData[key] : state.user[key === 'ew' ? 'weight' : 'tWeight'];
    state.sheetData[key] = Math.max(35, Math.round((cur + delta) * 10) / 10); render();
  },
  saveProfile() {
    const sd = state.sheetData;
    state.user.goal = sd.egoal || state.user.goal;
    state.user.actLvl = sd.eact || state.user.actLvl;
    if (sd.ew !== undefined) state.user.weight = sd.ew;
    if (sd.etw !== undefined) state.user.tWeight = sd.etw;
    state.user.targets = calcTargets({
      age: state.user.age, sex: state.user.sex, height: state.user.height,
      weight: state.user.weight, actLvl: state.user.actLvl, goal: state.user.goal,
    });
    app._persistUser(); state.sheet = null; render();
  },

  // ── Barcode scanner ──
  async startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) { state.scanner.status = 'idle'; render(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      state._pendingStream = stream;
      state._scanWired = false;
      state.scanner.status = 'scanning';
      render();
    } catch (e) {
      state.scanner.status = 'idle'; render();
    }
  },
  async _wireScanLoop(videoEl) {
    try {
      const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      state._scanReader = reader;

      // decodeFromVideoElementContinuously repeatedly grabs frames from the
      // already-live <video> element and calls back on every attempt — with
      // `result` set only when a barcode is actually found. This is the
      // correct continuous-scan API; the one-shot decodeFromVideoElement
      // used previously only checked a single frame around setup time,
      // which is why scanning appeared to "do nothing."
      reader.decodeFromVideoElementContinuously(videoEl, (result, err) => {
        if (result && state.scanner.status === 'scanning') {
          app.doLookup(result.getText());
        }
        // err fires on every frame with no barcode visible (NotFoundException) — expected, ignore.
      });
    } catch (e) {
      // ZXing failed to load entirely — try native BarcodeDetector as fallback (Chrome/Edge on Android)
      if ('BarcodeDetector' in window) {
        const bd = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
        state._scanPoll = setInterval(async () => {
          if (state.scanner.status !== 'scanning') return;
          try {
            const codes = await bd.detect(videoEl);
            if (codes.length > 0) app.doLookup(codes[0].rawValue);
          } catch (err) {}
        }, 500);
      } else {
        state.scanner.status = 'idle';
        state.scanner.err = 'Barcode scanning is not supported in this browser. Use manual entry or the photo option.';
        render();
      }
    }
  },
  async toggleTorch() {
    try {
      const track = state._pendingStream?.getVideoTracks?.()[0];
      if (!track) return;
      state._torch = !state._torch;
      await track.applyConstraints({ advanced: [{ torch: state._torch }] });
    } catch (e) { /* torch not supported on this device — ignore */ }
  },
  stopScanner() {
    if (state._scanReader) { try { state._scanReader.reset(); } catch (e) {} }
    if (state._scanPoll) { clearInterval(state._scanPoll); state._scanPoll = null; }
    if (state._bdInterval) { clearInterval(state._bdInterval); state._bdInterval = null; }
    if (state._pendingStream) { state._pendingStream.getTracks().forEach(t => t.stop()); state._pendingStream = null; }
    state._scanReader = null;
    state._scanWired = false;
  },
  async doLookup(code) {
    if (['looking', 'found'].includes(state.scanner.status)) return;
    app.stopScanner();
    state.scanner.status = 'looking'; render();
    try {
      const food = await lookupBarcode(code);
      if (food) { state.scanner.found = food; state.scanner.status = 'found'; }
      else {
        state.scanner.status = 'notfound'; state.scanner.manual = code;
        state.scanner.err = 'Product not found in Open Food Facts. Try a different product or enter it manually.';
      }
    } catch (e) {
      state.scanner.status = 'notfound'; state.scanner.manual = code;
      state.scanner.err = 'Network error looking up that barcode. Check your connection and try again.';
    }
    render();
  },
  manualLookup() { const code = state.scanner.manual?.trim(); if (!code) return; app.doLookup(code); },
  async photoLookup(ev) {
    const file = ev.target.files?.[0]; if (!file) return;
    state.scanner.status = 'looking'; render();
    const url = URL.createObjectURL(file);
    try {
      const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      const img = new Image(); img.src = url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      const result = await reader.decodeFromImageElement(img);
      URL.revokeObjectURL(url);
      await app.doLookup(result.getText());
    } catch (e) {
      URL.revokeObjectURL(url);
      state.scanner.status = 'notfound';
      state.scanner.err = "Couldn't read a barcode from that photo. Try a clearer, flatter shot or enter the number manually.";
      render();
    } finally {
      ev.target.value = '';
    }
  },
  addScannedFood() {
    const f = state.scanner.found; if (!f) return;
    const meal = state.scanner.targetMeal || state.selCat;
    const entry = { id: Date.now() + '-sc', name: f.name, brand: f.brand || '', serving: '1 serving', servings: 1, baseFood: f, cal: f.cal, pro: f.pro, carb: f.carb, fat: f.fat };
    if (!state.log.meals[meal]) state.log.meals[meal] = [];
    state.log.meals[meal].push(entry);
    app._saveToday(); state.sheet = null; state.selCat = meal;
    app._celebrate(entry.name, meal);
  },

  // ── Celebration / success takeover ──
  _celebrate(name, mealId) {
    const cat = state.cats.find(c => c.id === mealId);
    state.success = { name, mealId, mealLabel: cat ? cat.label : 'your log' };
    render();
  },
  closeSuccess() { state.success = null; state.tab = 'progress'; render(); },
  successAddAnother() { state.success = null; state.tab = 'search'; render(); },
};

// expose for inline onclick handlers in the generated HTML strings
window.app = app;
window.state = state;
window.render = render;
