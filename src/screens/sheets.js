import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { stepper, sheetHd } from '../lib/ui.js';
import { esc } from '../lib/helpers.js';
import { ACT_LEVELS, GOALS, CAT_ICONS, ROUTINE_ICONS, ACTS } from '../lib/constants.js';

export function renderSheet(state) {
  const s = state.sheet;
  let content = '';
  if (s === 'quickadd') content = renderQA(state);
  else if (s === 'scanner') content = renderScanner(state);
  else if (s === 'addfood') content = renderAddFood(state);
  else if (s === 'manualfood') content = renderManualFood(state);
  else if (s === 'addcat') content = renderAddCat(state);
  else if (s === 'editcat') content = renderEditCat(state);
  else if (s === 'addroutine') content = renderAddRoutine(state);
  else if (s === 'adjustgoal') content = renderAdjustGoal(state);
  else if (s === 'updateweight') content = renderUpdateWeight(state);
  else if (s === 'reminders') content = renderReminders(state);
  else if (s === 'editprofile') content = renderEditProfile(state);
  else if (s === 'activity') content = renderActivity(state);
  return `<div class="overlay" onclick="app.closeSheet()"><div class="sheet" onclick="event.stopPropagation()">${content}</div></div>`;
}

// ─── QUICK ADD ────────────────────────────────────────────────────────────
function renderQA() {
  const opts = [
    { label: 'Log food', desc: 'Search database', icon: 'progress', action: "app.closeSheet();app.tab('search')" },
    { label: 'Scan barcode', desc: 'Camera lookup', icon: 'scan', action: "app.sheet('scanner')" },
    { label: 'Log water', desc: '+1 cup', icon: 'water', action: 'app.logWater()' },
    { label: 'Log activity', desc: 'Track workout', icon: 'trend', action: "app.sheet('activity')" },
  ];
  return sheetHd('Quick add') + opts.map(o => `<button onclick="${o.action}" style="width:100%;display:flex;align-items:center;gap:14px;padding:15px;border-radius:18px;background:${C.card};margin-bottom:9px;text-align:left;cursor:pointer">
<div style="width:42px;height:42px;border-radius:13px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center">${ic(o.icon, C.brand, 18)}</div>
<div><div style="font-size:14px;font-weight:800;color:${C.ink}">${o.label}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">${o.desc}</div></div>
</button>`).join('');
}

// ─── ACTIVITY LOGGER ──────────────────────────────────────────────────────
function renderActivity(state) {
  const sd = state.sheetData;
  if (!sd.actPicked) {
    return sheetHd('Log activity') + `<div class="grid2">
${ACTS.map(a => `<button onclick="state.sheetData.actPicked='${a.id}';render()" style="padding:15px;border-radius:18px;display:flex;align-items:center;gap:12px;background:${C.card};text-align:left">
<div style="width:38px;height:38px;border-radius:12px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center">${ic('trend', C.brand, 16)}</div>
<div style="font-size:13px;font-weight:700;color:${C.ink}">${esc(a.name)}</div>
</button>`).join('')}
</div>`;
  }
  const act = ACTS.find(a => a.id === sd.actPicked);
  const mins = sd.actMinutes || 20;
  const burn = Math.round(act.met * state.user.weight * (mins / 60));
  return sheetHd(esc(act.name)) + `<div style="font-size:13px;color:${C.sub};margin-bottom:18px">How long was your session?</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
${[10, 15, 20, 30, 45, 60].map(m => `<button onclick="state.sheetData.actMinutes=${m};render()" style="padding:9px 16px;border-radius:22px;font-size:12px;font-weight:700;background:${mins === m ? C.action : C.card};color:${mins === m ? '#fff' : C.ink}">${m} min</button>`).join('')}
</div>
<div style="border-radius:18px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;background:${C.sage}">
<div style="font-size:14px;color:${C.actionDark};font-weight:600">Estimated burn</div>
<div style="font-size:18px;font-weight:800;color:${C.actionDark}">${burn} kcal</div>
</div>
<button onclick="app.saveActivity()" class="btn" style="background:${C.action};color:#fff">Log activity</button>`;
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────────────
function corners() {
  const c = '3px solid ' + C.action;
  const base = 'position:absolute;width:26px;height:26px';
  return `<div style="${base};top:0;left:0;border-top:${c};border-left:${c};border-top-left-radius:8px"></div>
<div style="${base};top:0;right:0;border-top:${c};border-right:${c};border-top-right-radius:8px"></div>
<div style="${base};bottom:0;left:0;border-bottom:${c};border-left:${c};border-bottom-left-radius:8px"></div>
<div style="${base};bottom:0;right:0;border-bottom:${c};border-right:${c};border-bottom-right-radius:8px"></div>`;
}

function renderScanner(state) {
  const sc = state.scanner;
  const BG = C.scan;
  const header = `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
<button onclick="app.closeSheet()" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center">${ic('x', '#fff', 16)}</button>
<div style="color:#fff;font-size:15px;font-weight:700">Scan Food</div>
<button onclick="app.toggleTorch()" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center">${ic('bolt', '#fff', 16)}</button>
</div>`;
  const lookupBtn = `<button onclick="app.manualLookup()" style="width:100%;padding:13px;border-radius:14px;font-size:14px;font-weight:700;background:${C.action};color:#fff">Look up</button>`;
  const photoBtn = `<label style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:14px;background:rgba(255,255,255,.12);cursor:pointer;font-size:14px;font-weight:700;color:#fff">
${ic('cam', '#fff', 16)} Take photo of barcode
<input type="file" accept="image/*" capture="environment" style="display:none" onchange="app.photoLookup(event)"/>
</label>`;

  if (sc.status === 'idle' || sc.status === 'starting') {
    return `<div style="background:${BG};border-radius:24px;overflow:hidden;color:#fff">
${header}
<div style="padding:8px 22px 24px;text-align:center">
<div style="margin:6px 0 20px">${ic('scan', C.action, 40)}</div>
<div style="margin-bottom:18px;color:rgba(255,255,255,.7);font-size:14px">Starting camera…</div>
<div style="margin-bottom:12px;color:rgba(255,255,255,.5);font-size:13px">Or enter barcode manually</div>
<input id="manual-bc" placeholder="e.g. 9342866000482" inputmode="numeric" style="width:100%;padding:13px 16px;border-radius:14px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
${lookupBtn}
<div style="margin-top:10px">${photoBtn}</div>
</div></div>`;
  }
  if (sc.status === 'scanning') {
    return `<div style="background:${BG};border-radius:24px;overflow:hidden">
${header}
<div style="position:relative">
<video id="scan-video" autoplay playsinline muted style="width:100%;height:240px;object-fit:cover;display:block"></video>
<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
<div style="position:relative;width:64%;height:140px">${corners()}</div>
</div></div>
<div style="padding:16px 18px;text-align:center">
<div style="color:#fff;font-size:14px;margin-bottom:4px">Point camera at a barcode</div>
<div style="color:rgba(255,255,255,.5);font-size:12px;margin-bottom:16px">Works with most packaged products</div>
<input id="manual-bc2" placeholder="Or enter barcode number" inputmode="numeric" style="width:100%;padding:13px;border-radius:14px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
${lookupBtn}
</div></div>`;
  }
  if (sc.status === 'looking') {
    return `<div style="background:${BG};border-radius:24px;padding:48px 24px;text-align:center;color:#fff">
<div class="spinner" style="margin-bottom:18px"></div>
<div style="font-size:16px;font-weight:700">Looking up product…</div>
<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px">Checking Open Food Facts</div>
</div>`;
  }
  if (sc.status === 'found' && sc.found) {
    const f = sc.found;
    const sel = state.scanner.targetMeal || state.selCat;
    return `<div>
${sheetHd('Product found')}
<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
<div style="width:52px;height:52px;border-radius:14px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:24px">🥫</div>
<div style="min-width:0"><div style="font-size:16px;font-weight:800;color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
<div style="font-size:12px;color:${C.sub}">${f.brand ? esc(f.brand) + ' · ' : ''}${esc(f.serving)}</div></div>
</div>
<div style="display:flex;justify-content:space-between;text-align:center;padding:14px 12px;border-radius:16px;background:${C.card};margin-bottom:20px">
<div><div style="font-size:15px;font-weight:800;color:${C.ink}">${f.cal}</div><div style="font-size:10px;color:${C.sub}">kcal</div></div>
<div><div style="font-size:15px;font-weight:800;color:${C.action}">${f.pro}g</div><div style="font-size:10px;color:${C.sub}">Protein</div></div>
<div><div style="font-size:15px;font-weight:800;color:${C.gold}">${f.carb}g</div><div style="font-size:10px;color:${C.sub}">Carbs</div></div>
<div><div style="font-size:15px;font-weight:800;color:${C.actionDark}">${f.fat}g</div><div style="font-size:10px;color:${C.sub}">Fat</div></div>
</div>
<div class="lbl">Add to</div>
<div class="scrollrow" style="margin-bottom:20px">
${state.cats.map(c => `<button onclick="state.scanner.targetMeal='${c.id}';render()" style="padding:9px 16px;border-radius:22px;font-size:12px;font-weight:700;flex-shrink:0;background:${sel === c.id ? C.action : C.card};color:${sel === c.id ? '#fff' : C.ink}">${c.icon} ${esc(c.label)}</button>`).join('')}
</div>
<button onclick="app.addScannedFood()" class="btn" style="background:${C.action};color:#fff">Add to ${esc(state.cats.find(c => c.id === sel)?.label || 'log')}</button>
</div>`;
  }
  if (sc.status === 'notfound') {
    return `<div style="background:${BG};border-radius:24px;padding:24px;text-align:center;color:#fff">
<div style="font-size:34px;margin-bottom:12px">🔍</div>
<div style="font-size:16px;font-weight:700;margin-bottom:8px">Product not found</div>
<div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px">${esc(sc.err || "We couldn't find that product. Try a clearer photo or enter the barcode manually.")}</div>
<input id="retry-bc" value="${esc(sc.manual || '')}" placeholder="Barcode number" inputmode="numeric" style="width:100%;padding:13px;border-radius:14px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
<button onclick="app.manualLookup()" style="width:100%;padding:13px;border-radius:14px;font-size:14px;font-weight:700;background:${C.action};color:#fff;margin-bottom:10px">Try again</button>
${photoBtn}
<button onclick="app.sheet('manualfood')" style="margin-top:14px;font-size:13px;font-weight:700;color:rgba(255,255,255,.85)">Enter nutrition manually instead</button>
</div>`;
  }
  return `<div style="padding:20px;text-align:center;color:${C.sub}">Starting scanner…</div>`;
}

// ─── ADD / EDIT FOOD ──────────────────────────────────────────────────────
function renderAddFood(state) {
  const sd = state.sheetData; const f = sd.food; if (!f) return '';
  const srv = sd.servings || 1;
  const cal = Math.round(f.cal * srv); const pro = Math.round(f.pro * srv * 10) / 10;
  const carb = Math.round(f.carb * srv * 10) / 10; const fat = Math.round(f.fat * srv * 10) / 10;
  const meal = sd.meal || state.selCat;
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
<div><div style="font-size:19px;font-weight:800;color:${C.ink}">${esc(f.name)}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">${f.brand ? esc(f.brand) + ' · ' : ''}${esc(f.serving)}</div></div>
<button onclick="app.closeSheet()" style="width:34px;height:34px;border-radius:50%;background:${C.card};display:flex;align-items:center;justify-content:center">${ic('x', C.ink, 16)}</button>
</div>
<div class="lbl">Servings</div>
${stepper('af-srv', srv, 'app.afSrv(-.5)', 'app.afSrv(.5)')}
<div class="lbl" style="margin-top:16px">${sd.existing ? 'Meal' : 'Add to'}</div>
<div class="scrollrow" style="margin-bottom:16px">
${state.cats.map(c => `<button onclick="state.sheetData.meal='${c.id}';render()" style="padding:9px 16px;border-radius:22px;font-size:12px;font-weight:700;flex-shrink:0;background:${meal === c.id ? C.action : C.card};color:${meal === c.id ? '#fff' : C.ink}">${c.icon} ${esc(c.label)}</button>`).join('')}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:16px;margin-bottom:16px;background:${C.warm}">
<div style="font-size:15px;font-weight:800;color:${C.ink}">${cal} kcal</div>
<div style="display:flex;gap:12px;font-size:12px;color:${C.ink}">
<span><b style="color:${C.actionDark}">${pro}g</b> P</span>
<span><b style="color:${C.brandDark}">${carb}g</b> C</span>
<span><b style="color:${C.actionDark}">${fat}g</b> F</span>
</div></div>
<button onclick="app.saveFood()" class="btn" style="background:${C.action};color:#fff">${sd.existing ? 'Save changes' : 'Add to ' + esc(state.cats.find(c => c.id === meal)?.label || '')}</button>
${sd.existing ? `<button onclick="app.removeFood()" class="btn" style="background:transparent;color:${C.sub};margin-top:8px">${ic('trash', C.sub, 15)} Remove from log</button>` : ''}`;
}

// ─── MANUAL FOOD ENTRY ────────────────────────────────────────────────────
function renderManualFood(state) {
  const sd = state.sheetData;
  const v = (k) => esc(sd[k] !== undefined ? sd[k] : '');
  const field = (label, key, ph, mode) => `<div class="lbl">${label}</div>
<input class="inp" style="margin-bottom:14px" placeholder="${ph}" value="${v(key)}" ${mode ? `inputmode="${mode}"` : ''} oninput="state.sheetData.${key}=this.value"/>`;
  return sheetHd('Add food manually') + `<div style="font-size:13px;color:${C.sub};margin-bottom:16px">Enter what you know — you'll pick the meal and servings next.</div>
${field('Name', 'mfName', 'e.g. Homemade smoothie', '')}
<div class="grid2">
<div>${field('Calories (kcal)', 'mfCal', '0', 'numeric')}</div>
<div>${field('Protein (g)', 'mfPro', '0', 'decimal')}</div>
<div>${field('Carbs (g)', 'mfCarb', '0', 'decimal')}</div>
<div>${field('Fat (g)', 'mfFat', '0', 'decimal')}</div>
</div>
${sd.mfErr ? `<div style="font-size:12px;padding:10px 14px;border-radius:12px;background:${C.warm};color:${C.ink};margin:4px 0 12px">${esc(sd.mfErr)}</div>` : ''}
<button onclick="app.saveManualFood()" class="btn" style="background:${C.action};color:#fff;margin-top:6px">Continue</button>`;
}

// ─── CATEGORY MANAGEMENT ──────────────────────────────────────────────────
function iconPicker(list, sel, setter) {
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
${list.map(e => `<button onclick="${setter}('${e}');render()" style="width:42px;height:42px;border-radius:13px;font-size:20px;background:${sel === e ? C.brand : C.card}">${e}</button>`).join('')}
</div>`;
}

function renderAddCat(state) {
  const sd = state.sheetData; const ready = (sd.newLabel || '').trim();
  return sheetHd('Add a meal') + `<div class="lbl">Name</div>
<input class="inp" style="margin-bottom:16px" placeholder="e.g. Pre-workout" oninput="state.sheetData.newLabel=this.value"/>
<div class="lbl">Icon</div>
${iconPicker(CAT_ICONS, sd.newIcon, 'state.sheetData.newIcon=')}
<button onclick="app.saveNewCat()" class="btn" style="background:${ready ? C.action : C.card};color:${ready ? '#fff' : C.sub}">Add meal</button>`;
}

function renderEditCat(state) {
  const sd = state.sheetData; const cat = state.cats.find(c => c.id === sd.catId); if (!cat) return '';
  const lbl = sd.editLabel !== undefined ? sd.editLabel : cat.label;
  const ico = sd.editIcon !== undefined ? sd.editIcon : cat.icon;
  return sheetHd('Edit meal') + `<div class="lbl">Name</div>
<input class="inp" value="${esc(lbl)}" style="margin-bottom:16px" oninput="state.sheetData.editLabel=this.value"/>
<div class="lbl">Icon</div>
${iconPicker(CAT_ICONS, ico, 'state.sheetData.editIcon=')}
<button onclick="app.saveCatEdit()" class="btn" style="background:${C.action};color:#fff;margin-bottom:10px">Save changes</button>
${state.cats.length > 1 ? `<button onclick="app.deleteCat('${cat.id}')" class="btn" style="background:transparent;color:${C.sub}">${ic('trash', C.sub, 15)} Delete meal</button>` : ''}`;
}

function renderAddRoutine(state) {
  const sd = state.sheetData; const ready = (sd.newLabel || '').trim();
  return sheetHd('Add to routine') + `<div class="lbl">Label</div>
<input class="inp" style="margin-bottom:16px" placeholder="e.g. Take vitamins" oninput="state.sheetData.newLabel=this.value"/>
<div class="lbl">Icon</div>
${iconPicker(ROUTINE_ICONS, sd.newIcon, 'state.sheetData.newIcon=')}
<button onclick="app.saveNewRoutine()" class="btn" style="background:${ready ? C.action : C.card};color:${ready ? '#fff' : C.sub}">Add</button>`;
}

// ─── GOAL / WEIGHT ────────────────────────────────────────────────────────
function renderAdjustGoal(state) {
  const sd = state.sheetData; const t = state.user.targets;
  const cal = sd.gcal !== undefined ? sd.gcal : t.cal;
  const pro = sd.gpro !== undefined ? sd.gpro : t.pro;
  const carb = sd.gcarb !== undefined ? sd.gcarb : t.carb;
  const fat = sd.gfat !== undefined ? sd.gfat : t.fat;
  return sheetHd('Adjust goals') +
    `<div class="lbl">Calories (kcal)</div>${stepper('ag-cal', cal, 'app.gAdj("gcal",-50)', 'app.gAdj("gcal",50)')}
<div class="lbl" style="margin-top:14px">Protein (g)</div>${stepper('ag-pro', pro, 'app.gAdj("gpro",-5)', 'app.gAdj("gpro",5)', ' g')}
<div class="lbl" style="margin-top:14px">Carbs (g)</div>${stepper('ag-carb', carb, 'app.gAdj("gcarb",-5)', 'app.gAdj("gcarb",5)', ' g')}
<div class="lbl" style="margin-top:14px">Fat (g)</div>${stepper('ag-fat', fat, 'app.gAdj("gfat",-5)', 'app.gAdj("gfat",5)', ' g')}
<button onclick="app.saveGoal()" class="btn" style="background:${C.action};color:#fff;margin-top:20px">Save goals</button>`;
}

function renderUpdateWeight(state) {
  const sd = state.sheetData; const w = sd.newW !== undefined ? sd.newW : state.user.weight;
  return sheetHd('Log weight') + `<div style="font-size:13px;color:${C.sub};margin-bottom:20px">Target: ${state.user.tWeight} kg</div>
<div style="display:flex;justify-content:center;margin-bottom:20px">${stepper('uw-w', w, 'app.wAdj(-.5)', 'app.wAdj(.5)', ' kg')}</div>
<button onclick="app.saveWeight()" class="btn" style="background:${C.action};color:#fff">Save weight</button>`;
}

function renderReminders(state) {
  const r = state.user.reminders || {};
  const items = [
    { id: 'breakfast', label: 'Breakfast reminder', time: '8:00 AM' },
    { id: 'lunch', label: 'Lunch', time: '12:30 PM' },
    { id: 'dinner', label: 'Dinner', time: '7:00 PM' },
    { id: 'water', label: 'Water', time: 'Every 2 hours' },
  ];
  return sheetHd('Reminders') + items.map(it => `<button onclick="app.toggleReminder('${it.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:15px;border-radius:18px;background:${C.card};margin-bottom:9px;cursor:pointer">
<div style="text-align:left"><div style="font-size:14px;font-weight:700;color:${C.ink}">${it.label}</div>
<div style="font-size:12px;color:${C.sub}">${it.time}</div></div>
<div style="width:46px;height:26px;border-radius:13px;position:relative;background:${r[it.id] ? C.action : C.border};transition:background .2s">
<div style="position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s;left:${r[it.id] ? 22 : 2}px"></div>
</div></button>`).join('') + `<button onclick="app.closeSheet()" class="btn" style="background:${C.action};color:#fff;margin-top:10px">Done</button>`;
}

function renderEditProfile(state) {
  const sd = state.sheetData; const u = state.user;
  const goal = sd.egoal || u.goal;
  const actLvl = sd.eact || u.actLvl;
  const weight = sd.ew !== undefined ? sd.ew : u.weight;
  const tWeight = sd.etw !== undefined ? sd.etw : u.tWeight;
  return sheetHd('Edit goals & stats') + `<div class="lbl">Goal</div>
<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
${GOALS.map(g => `<button onclick="state.sheetData.egoal='${g.id}';render()" style="padding:9px 14px;border-radius:22px;font-size:12px;font-weight:700;background:${goal === g.id ? C.brand : C.card};color:${goal === g.id ? '#fff' : C.ink}">${g.icon} ${esc(g.label)}</button>`).join('')}
</div>
<div class="lbl">Weight (kg)</div>${stepper('ep-w', weight, 'app.epAdj("ew",-.5)', 'app.epAdj("ew",.5)', ' kg')}
<div class="lbl" style="margin-top:14px">Target weight (kg)</div>${stepper('ep-tw', tWeight, 'app.epAdj("etw",-.5)', 'app.epAdj("etw",.5)', ' kg')}
<div class="lbl" style="margin-top:14px">Activity level</div>
<div class="space" style="margin-bottom:20px">
${ACT_LEVELS.map(a => `<button onclick="state.sheetData.eact='${a.id}';render()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:14px;text-align:left;background:${actLvl === a.id ? C.action : C.card};cursor:pointer">
<div style="font-size:14px;font-weight:700;color:${actLvl === a.id ? '#fff' : C.ink}">${esc(a.label)}</div>
${actLvl === a.id ? `<div style="color:#fff">${ic('check', '#fff', 16)}</div>` : ''}
</button>`).join('')}
</div>
<button onclick="app.saveProfile()" class="btn" style="background:${C.action};color:#fff">Save changes</button>`;
}
