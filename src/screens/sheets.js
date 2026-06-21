import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { stepper, sheetHd } from '../lib/ui.js';
import { ACT_LEVELS, GOALS, CAT_ICONS, ROUTINE_ICONS, ACTS } from '../lib/constants.js';

export function renderSheet(state) {
  const s = state.sheet;
  let content = '';
  if (s === 'quickadd') content = renderQA(state);
  else if (s === 'scanner') content = renderScanner(state);
  else if (s === 'addfood') content = renderAddFood(state);
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
    { label: 'Log water', desc: '+1 cup', icon: 'bell', action: 'app.logWater()' },
    { label: 'Log activity', desc: 'Track workout', icon: 'progress', action: "app.sheet('activity')" },
  ];
  return sheetHd('Quick add') + opts.map(o => `<button onclick="${o.action}" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;background:${C.bg};margin-bottom:8px;text-align:left;cursor:pointer">
<div style="width:40px;height:40px;border-radius:12px;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic(o.icon, C.blue, 18)}</div>
<div><div style="font-size:14px;font-weight:700;color:${C.ink}">${o.label}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">${o.desc}</div></div>
</button>`).join('');
}

// ─── ACTIVITY LOGGER ──────────────────────────────────────────────────────
function renderActivity(state) {
  const sd = state.sheetData;
  if (!sd.actPicked) {
    return sheetHd('Log activity') + `<div class="grid2">
${ACTS.map(a => `<button onclick="state.sheetData.actPicked='${a.id}';render()" style="padding:14px;border-radius:16px;display:flex;align-items:center;gap:12px;background:${C.bg};text-align:left">
<div style="width:36px;height:36px;border-radius:12px;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('progress', C.blue, 16)}</div>
<div style="font-size:13px;font-weight:600;color:${C.ink}">${a.name}</div>
</button>`).join('')}
</div>`;
  }
  const act = ACTS.find(a => a.id === sd.actPicked);
  const mins = sd.actMinutes || 20;
  const burn = Math.round(act.met * state.user.weight * (mins / 60));
  return sheetHd(act.name) + `<div style="font-size:12px;color:${C.sub};margin-bottom:20px">How long was your session?</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
${[10, 15, 20, 30, 45, 60].map(m => `<button onclick="state.sheetData.actMinutes=${m};render()" style="padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;background:${mins === m ? C.blue : C.blueSoft};color:${mins === m ? '#fff' : C.blue}">${m} min</button>`).join('')}
</div>
<div style="border-radius:16px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;background:${C.bg}">
<div style="font-size:14px;color:${C.sub}">Estimated burn</div>
<div style="font-size:18px;font-weight:700;color:${C.blue}">${burn} kcal</div>
</div>
<button onclick="app.saveActivity()" class="btn" style="background:${C.blue};color:#fff">Log activity</button>`;
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────────────
function renderScanner(state) {
  const sc = state.scanner;
  const BG = '#0E1730';
  if (sc.status === 'idle' || sc.status === 'starting') {
    return `<div style="background:${BG};border-radius:20px;padding:24px;text-align:center;color:#fff">
<div style="font-size:16px;font-weight:700;margin-bottom:20px">Scan barcode</div>
${ic('scan', '#7FB1FF', 40)}
<div style="margin:16px 0;color:rgba(255,255,255,.7);font-size:14px">Starting camera…</div>
<div style="margin-bottom:16px;color:rgba(255,255,255,.5);font-size:13px">Or enter barcode manually:</div>
<input id="manual-bc" placeholder="e.g. 9342866000482" inputmode="numeric" style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
<button onclick="app.manualLookup()" style="width:100%;padding:12px;border-radius:12px;font-size:14px;font-weight:700;background:${C.sky};color:${BG}">Look up</button>
<div style="margin-top:16px">
<label style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:rgba(255,255,255,.1);cursor:pointer;font-size:14px;font-weight:700;color:#fff">
${ic('cam', '#fff', 16)} Take photo of barcode
<input type="file" accept="image/*" capture="environment" style="display:none" onchange="app.photoLookup(event)"/>
</label></div></div>`;
  }
  if (sc.status === 'scanning') {
    return `<div style="background:${BG};border-radius:20px;overflow:hidden">
<video id="scan-video" autoplay playsinline muted style="width:100%;height:220px;object-fit:cover;display:block"></video>
<div style="padding:16px;text-align:center">
<div style="color:#fff;font-size:14px;margin-bottom:4px">Scanning… point camera at barcode</div>
<div style="color:rgba(255,255,255,.5);font-size:12px;margin-bottom:16px">Works with Woolworths, Coles, Aldi &amp; most packaged products</div>
<div style="margin-bottom:12px;color:rgba(255,255,255,.5);font-size:13px">Or enter manually:</div>
<input id="manual-bc2" placeholder="Barcode number" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
<button onclick="app.manualLookup()" style="width:100%;padding:12px;border-radius:12px;font-size:14px;font-weight:700;background:${C.sky};color:${BG}">Look up</button>
</div></div>`;
  }
  if (sc.status === 'looking') {
    return `<div style="background:${BG};border-radius:20px;padding:40px;text-align:center;color:#fff">
<div class="spinner" style="margin-bottom:16px"></div>
<div style="font-size:16px;font-weight:700">Looking up product…</div>
<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px">Checking Open Food Facts database</div>
</div>`;
  }
  if (sc.status === 'found' && sc.found) {
    const f = sc.found;
    return `<div>
${sheetHd('Product found!')}
<div style="font-size:16px;font-weight:700;color:${C.ink};margin-bottom:4px">${f.name}</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:12px">${f.brand ? f.brand + ' · ' : ''}${f.serving}</div>
<div style="display:flex;gap:16px;font-size:13px;padding:12px 16px;border-radius:12px;background:${C.bg};margin-bottom:20px">
<span><b style="color:${C.ink}">${f.cal}</b> kcal</span>
<span><b style="color:${C.blue}">${f.pro}g</b> P</span>
<span><b style="color:${C.sky}">${f.carb}g</b> C</span>
<span><b style="color:${C.blueDark}">${f.fat}g</b> F</span>
</div>
<div class="lbl">Add to meal</div>
<div class="scrollrow" style="margin-bottom:20px">
${state.cats.map(c => `<button onclick="state.scanner.targetMeal='${c.id}'" style="padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;flex-shrink:0;background:${(state.scanner.targetMeal || state.selCat) === c.id ? C.blue : C.blueSoft};color:${(state.scanner.targetMeal || state.selCat) === c.id ? '#fff' : C.blue}">${c.icon} ${c.label}</button>`).join('')}
</div>
<button onclick="app.addScannedFood()" class="btn" style="background:${C.blue};color:#fff">Add to log</button>
</div>`;
  }
  if (sc.status === 'notfound') {
    return `<div style="background:${BG};border-radius:20px;padding:24px;text-align:center;color:#fff">
<div style="font-size:32px;margin-bottom:12px">🔍</div>
<div style="font-size:16px;font-weight:700;margin-bottom:8px">Product not found</div>
<div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px">${sc.err || "We couldn't find that product in Open Food Facts. Try a clearer photo or enter the barcode manually."}</div>
<input id="retry-bc" value="${sc.manual || ''}" placeholder="Barcode number" inputmode="numeric" style="width:100%;padding:12px;border-radius:12px;font-size:14px;background:rgba(255,255,255,.1);color:#fff;border:none;outline:none;margin-bottom:10px" oninput="state.scanner.manual=this.value"/>
<button onclick="app.manualLookup()" style="width:100%;padding:12px;border-radius:12px;font-size:14px;font-weight:700;background:${C.sky};color:${BG};margin-bottom:10px">Try again</button>
<label style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:rgba(255,255,255,.1);cursor:pointer;font-size:14px;font-weight:700;color:#fff">
${ic('cam', '#fff', 16)} Take another photo
<input type="file" accept="image/*" capture="environment" style="display:none" onchange="app.photoLookup(event)"/>
</label>
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
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
<div><div style="font-size:18px;font-weight:700;color:${C.ink}">${f.name}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">${f.brand ? f.brand + ' · ' : ''}${f.serving}</div></div>
<button onclick="app.closeSheet()" style="width:32px;height:32px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('x', C.blue, 16)}</button>
</div>
<div class="lbl">Servings</div>
${stepper('af-srv', srv, 'app.afSrv(-.5)', 'app.afSrv(.5)')}
<div class="lbl" style="margin-top:14px">${sd.existing ? 'Meal' : 'Add to'}</div>
<div class="scrollrow" style="margin-bottom:16px">
${state.cats.map(c => `<button onclick="state.sheetData.meal='${c.id}';render()" style="padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;flex-shrink:0;background:${meal === c.id ? C.blue : C.blueSoft};color:${meal === c.id ? '#fff' : C.blue}">${c.icon} ${c.label}</button>`).join('')}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;margin-bottom:16px;background:${C.bg}">
<div style="font-size:14px;font-weight:700;color:${C.ink}">${cal} kcal</div>
<div style="display:flex;gap:12px;font-size:12px;color:${C.sub}">
<span><b style="color:${C.blue}">${pro}g</b> P</span>
<span><b style="color:${C.sky}">${carb}g</b> C</span>
<span><b style="color:${C.blueDark}">${fat}g</b> F</span>
</div></div>
<button onclick="app.saveFood()" class="btn" style="background:${C.blue};color:#fff">${sd.existing ? 'Save changes' : 'Add to ' + (state.cats.find(c => c.id === meal)?.label || '')}</button>
${sd.existing ? `<button onclick="app.removeFood()" class="btn" style="background:${C.ice};color:${C.blueDark};margin-top:10px">${ic('trash', C.blueDark, 15)} Remove from log</button>` : ''}`;
}

// ─── CATEGORY MANAGEMENT ──────────────────────────────────────────────────
function renderAddCat(state) {
  const sd = state.sheetData;
  return sheetHd('Add a meal') + `<div class="lbl">Name</div>
<input class="inp" style="margin-bottom:16px" placeholder="e.g. Pre-workout" oninput="state.sheetData.newLabel=this.value"/>
<div class="lbl">Icon</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
${CAT_ICONS.map(e => `<button onclick="state.sheetData.newIcon='${e}';render()" style="width:40px;height:40px;border-radius:12px;font-size:20px;background:${sd.newIcon === e ? C.blue : C.blueSoft}">${e}</button>`).join('')}
</div>
<button onclick="app.saveNewCat()" class="btn" style="background:${(sd.newLabel || '').trim() ? C.blue : C.border};color:${(sd.newLabel || '').trim() ? '#fff' : C.sub}">Add meal</button>`;
}

function renderEditCat(state) {
  const sd = state.sheetData; const cat = state.cats.find(c => c.id === sd.catId); if (!cat) return '';
  const lbl = sd.editLabel !== undefined ? sd.editLabel : cat.label;
  const ico = sd.editIcon !== undefined ? sd.editIcon : cat.icon;
  return sheetHd('Edit meal') + `<div class="lbl">Name</div>
<input class="inp" value="${lbl}" style="margin-bottom:16px" oninput="state.sheetData.editLabel=this.value"/>
<div class="lbl">Icon</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
${CAT_ICONS.map(e => `<button onclick="state.sheetData.editIcon='${e}';render()" style="width:40px;height:40px;border-radius:12px;font-size:20px;background:${ico === e ? C.blue : C.blueSoft}">${e}</button>`).join('')}
</div>
<button onclick="app.saveCatEdit()" class="btn" style="background:${C.blue};color:#fff;margin-bottom:10px">Save changes</button>
${state.cats.length > 1 ? `<button onclick="app.deleteCat('${cat.id}')" class="btn" style="background:${C.ice};color:${C.blueDark}">${ic('trash', C.blueDark, 15)} Delete meal</button>` : ''}`;
}

function renderAddRoutine(state) {
  const sd = state.sheetData;
  return sheetHd('Add to routine') + `<div class="lbl">Label</div>
<input class="inp" style="margin-bottom:16px" placeholder="e.g. Take vitamins" oninput="state.sheetData.newLabel=this.value"/>
<div class="lbl">Icon</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
${ROUTINE_ICONS.map(e => `<button onclick="state.sheetData.newIcon='${e}';render()" style="width:40px;height:40px;border-radius:12px;font-size:20px;background:${sd.newIcon === e ? C.blue : C.blueSoft}">${e}</button>`).join('')}
</div>
<button onclick="app.saveNewRoutine()" class="btn" style="background:${(sd.newLabel || '').trim() ? C.blue : C.border};color:${(sd.newLabel || '').trim() ? '#fff' : C.sub}">Add</button>`;
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
<button onclick="app.saveGoal()" class="btn" style="background:${C.blue};color:#fff;margin-top:20px">Save goals</button>`;
}

function renderUpdateWeight(state) {
  const sd = state.sheetData; const w = sd.newW !== undefined ? sd.newW : state.user.weight;
  return sheetHd('Update weight') + `<div style="font-size:12px;color:${C.sub};margin-bottom:20px">Target: ${state.user.tWeight} kg</div>
<div style="display:flex;justify-content:center;margin-bottom:20px">${stepper('uw-w', w, 'app.wAdj(-.5)', 'app.wAdj(.5)', ' kg')}</div>
<button onclick="app.saveWeight()" class="btn" style="background:${C.blue};color:#fff">Save weight</button>`;
}

function renderReminders(state) {
  const r = state.user.reminders || {};
  const items = [
    { id: 'breakfast', label: 'Breakfast reminder', time: '8:00 AM' },
    { id: 'lunch', label: 'Lunch', time: '12:30 PM' },
    { id: 'dinner', label: 'Dinner', time: '7:00 PM' },
    { id: 'water', label: 'Water', time: 'Every 2 hours' },
  ];
  return sheetHd('Reminders') + items.map(it => `<button onclick="app.toggleReminder('${it.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:16px;background:${C.bg};margin-bottom:8px;cursor:pointer">
<div style="text-align:left"><div style="font-size:14px;font-weight:600;color:${C.ink}">${it.label}</div>
<div style="font-size:12px;color:${C.sub}">${it.time}</div></div>
<div style="width:44px;height:24px;border-radius:12px;position:relative;background:${r[it.id] ? C.blue : C.border};transition:background .2s">
<div style="position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;left:${r[it.id] ? 22 : 2}px"></div>
</div></button>`).join('') + `<button onclick="app.closeSheet()" class="btn" style="background:${C.blue};color:#fff;margin-top:10px">Done</button>`;
}

function renderEditProfile(state) {
  const sd = state.sheetData; const u = state.user;
  const goal = sd.egoal || u.goal;
  const actLvl = sd.eact || u.actLvl;
  const weight = sd.ew !== undefined ? sd.ew : u.weight;
  const tWeight = sd.etw !== undefined ? sd.etw : u.tWeight;
  return sheetHd('Edit goals & stats') + `<div class="lbl">Goal</div>
<div style="display:flex;gap:8px;margin-bottom:16px">
${GOALS.map(g => `<button onclick="state.sheetData.egoal='${g.id}';render()" style="padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${goal === g.id ? C.blue : C.blueSoft};color:${goal === g.id ? '#fff' : C.blue}">${g.icon} ${g.label}</button>`).join('')}
</div>
<div class="lbl">Weight (kg)</div>${stepper('ep-w', weight, 'app.epAdj("ew",-.5)', 'app.epAdj("ew",.5)', ' kg')}
<div class="lbl" style="margin-top:14px">Target weight (kg)</div>${stepper('ep-tw', tWeight, 'app.epAdj("etw",-.5)', 'app.epAdj("etw",.5)', ' kg')}
<div class="lbl" style="margin-top:14px">Activity level</div>
<div class="space" style="margin-bottom:20px">
${ACT_LEVELS.map(a => `<button onclick="state.sheetData.eact='${a.id}';render()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:12px;text-align:left;background:${actLvl === a.id ? C.blue : C.bg};border:1px solid ${actLvl === a.id ? C.blue : C.border};cursor:pointer">
<div style="font-size:14px;font-weight:600;color:${actLvl === a.id ? '#fff' : C.ink}">${a.label}</div>
${actLvl === a.id ? `<div style="color:#fff">${ic('check', '#fff', 16)}</div>` : ''}
</button>`).join('')}
</div>
<button onclick="app.saveProfile()" class="btn" style="background:${C.blue};color:#fff">Save changes</button>`;
}
