import { C } from './lib/constants.js';
import { ic, SVG } from './lib/icons.js';
import { S } from './lib/storage.js';
import {
  dKey, calcTargets, emptyLog, fixLog, sumLog, autoCat, lookupBarcode,
} from './lib/helpers.js';
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
  progressSubTab: 'log',
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
  _scanReader: null,
};
// keep a `progressSub` alias name used inside progress.js
Object.defineProperty(state, 'progressSub', {
  get() { return state.progressSubTab; },
  set(v) { state.progressSubTab = v; },
});

// ─── RENDER ───────────────────────────────────────────────────────────────
export function render() {
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

    root.innerHTML = `<div class="shell">
<div class="screen">${screenHTML}</div>
<nav class="nav">${nav}</nav>
${sheetHTML}
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
  progressSub(s) { state.progressSubTab = s; render(); },
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

  // ── Auth (simple local signup/login — no API key) ──
  auth() {
    const mode = state.sheetData.authMode || 'signup';
    const name = (document.getElementById('au-name')?.value || '').trim();
    const email = (document.getElementById('au-email')?.value || '').trim();
    const pw = (document.getElementById('au-pw')?.value || '').trim();

    if (mode === 'signup') {
      if (!name) { state.loginErr = 'Please enter your name.'; render(); return; }
      if (!email) { state.loginErr = 'Please enter an email.'; render(); return; }
      state.user = { name, email, _pending: true };
      state.loginErr = '';
      state.stage = 'onboard';
      render();
    } else {
      const u = S.get('user');
      if (u && (!email || u.email === email)) {
        state.user = { reminders: {}, ...u };
        app._loadToday();
        state.stage = 'app';
        render();
      } else {
        state.loginErr = 'No account found with that email — try Sign up.';
        render();
      }
    }
  },
  logout() { state.stage = 'auth'; state.loginErr = ''; render(); },
  reset() {
    S.del('user'); S.del('cats'); S.del('routine'); S.del('log:' + dKey(0));
    for (let o = -6; o < 0; o++) S.del('sum:' + dKey(o));
    state.user = null; state.log = null; state.cache = {};
    state.cats = DEF_CATS.slice(); state.routine = DEF_ROUTINE.slice();
    state.selDate = dKey(0); state.wOff = 0;
    state.stage = 'auth'; render();
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
        name: state.user.name, email: state.user.email,
        goal: o.goal, sex: o.sex, age: o.age, height: o.height,
        weight: o.weight, tWeight: o.tWeight, startWeight: o.weight, actLvl: o.actLvl,
        targets, reminders: { breakfast: true, lunch: true, dinner: true, water: false },
      };
      state.user = u; S.set('user', u);
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
  },
  _saveToday() {
    S.set('log:' + dKey(0), state.log);
    const s = sumLog(state.log);
    state.cache[dKey(0)] = s; S.set('sum:' + dKey(0), s);
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

  // ── Food ──
  addFoodFromSearch(id) {
    const f = FOODS.find(x => x.id === id); if (!f) return;
    state.sheet = 'addfood'; state.sheetData = { food: f, servings: 1, meal: autoCat(state.cats) };
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
    if (sd.existing) {
      const om = sd.existing.meal;
      state.log.meals[om] = state.log.meals[om].filter(i => i.id !== sd.existing.id);
    }
    if (!state.log.meals[meal]) state.log.meals[meal] = [];
    state.log.meals[meal].push(entry);
    app._saveToday(); state.sheet = null; state.tab = 'progress'; state.progressSubTab = 'log'; state.selCat = meal; render();
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
      if (cat) { state.selCat = cat.id; state.tab = 'progress'; state.progressSubTab = 'log'; state.sheet = null; render(); }
      return;
    }
    state.log.done[rid] = !state.log.done[rid]; app._saveToday(); render();
  },
  toggleReminder(id) {
    if (!state.user.reminders) state.user.reminders = {};
    state.user.reminders[id] = !state.user.reminders[id];
    S.set('user', state.user); render();
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
    S.set('user', state.user); state.sheet = null; render();
  },
  wAdj(d) {
    const cur = state.sheetData.newW !== undefined ? state.sheetData.newW : state.user.weight;
    state.sheetData.newW = Math.max(35, Math.round((cur + d) * 10) / 10); render();
  },
  saveWeight() {
    const w = state.sheetData.newW !== undefined ? state.sheetData.newW : state.user.weight;
    state.user.weight = w; S.set('user', state.user); state.sheet = null; render();
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
    S.set('user', state.user); state.sheet = null; render();
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
    app._saveToday(); state.sheet = null; state.tab = 'progress'; state.progressSubTab = 'log'; state.selCat = meal; render();
  },
};

// expose for inline onclick handlers in the generated HTML strings
window.app = app;
window.state = state;
window.render = render;
