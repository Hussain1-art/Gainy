import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing, weekCalendarHTML, barChart, lineChart } from '../lib/ui.js';
import { sumLog, dKey, esc, weightChanges, weeklyAverages } from '../lib/helpers.js';

// Single scrollable page:
//   Today's log (date selector · macros · meal sections)
//   + Progress Engine (streak · weight trend · weight changes · averages).

export function renderProgress(state) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
<div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:${C.brand}">GAINY</div><div style="font-size:26px;font-weight:800;color:${C.ink}">Progress</div></div>
<button onclick="app.sheet('scanner')" style="width:46px;height:46px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center" class="soft">${ic('cam', '#fff')}</button>
</div>
${renderLogSection(state)}
${renderEngine(state)}`;
}

// ─── LOG SECTION (date selector + macros + meal sections) ─────────────────
function renderLogSection(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const rem = t.cal - sum.cal;

  const catTabs = state.cats.map(c => {
    const kcal = isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0;
    const active = c.id === state.selCat;
    return `<button onclick="app.selCat('${c.id}')" style="flex-shrink:0;border-radius:18px;padding:11px 16px;text-align:left;background:${active ? C.brand : C.card};cursor:pointer">
<div style="font-size:12px;font-weight:700;color:${active ? '#fff' : C.ink}">${c.icon} ${esc(c.label)}</div>
<div style="font-size:11px;margin-top:2px;color:${active ? 'rgba(255,255,255,.8)' : C.sub}">${kcal} kcal</div>
</button>`;
  }).join('');

  const activeCat = state.cats.find(c => c.id === state.selCat) || state.cats[0];
  const activeItems = isToday ? (state.log.meals[state.selCat] || []) : [];
  const itemRows = activeItems.map(it => `<button onclick="app.editFood('${state.selCat}','${it.id}')" style="width:100%;display:flex;justify-content:space-between;font-size:13px;padding:10px 0;border-top:1px solid ${C.border};color:${C.sub};text-align:left;cursor:pointer">
<span>${esc(it.name)} <span style="color:#BDB6AE">· ${esc(it.serving)}</span></span>
<span style="font-weight:700;color:${C.ink}">${it.cal} kcal</span>
</button>`).join('');

  const chartData = state.cats.map(c => ({ label: esc(c.label), v: isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0, color: c.id === state.selCat ? C.brand : C.warm }));

  return `
${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}
<div class="card-white" style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px;padding:22px">
${donutRing([
    { v: sum.cal, max: t.cal, color: C.brand, bg: C.warm },
    { v: sum.pro, max: t.pro, color: C.action, bg: C.sage },
    { v: sum.carb, max: t.carb, color: C.gold, bg: C.warm },
    { v: sum.fat, max: t.fat, color: C.actionDark, bg: C.sage },
  ], 158, sum.cal, 'kcal logged')}
<div style="font-size:13px;font-weight:700;margin-top:10px;color:${rem >= 0 ? C.action : C.brand}">${rem >= 0 ? rem + ' kcal left today' : Math.abs(rem) + ' kcal over goal'}</div>
</div>
<div class="grid3" style="margin-bottom:22px">
<div class="card" style="text-align:center"><div style="font-size:15px;font-weight:800;color:${C.action}">${Math.round(sum.pro)}g</div><div style="font-size:10px;color:${C.sub};margin-top:2px">Protein /${t.pro}g</div></div>
<div class="card" style="text-align:center"><div style="font-size:15px;font-weight:800;color:${C.gold}">${Math.round(sum.carb)}g</div><div style="font-size:10px;color:${C.sub};margin-top:2px">Carbs /${t.carb}g</div></div>
<div class="card" style="text-align:center"><div style="font-size:15px;font-weight:800;color:${C.actionDark}">${Math.round(sum.fat)}g</div><div style="font-size:10px;color:${C.sub};margin-top:2px">Fat /${t.fat}g</div></div>
</div>
<div class="section-hd">
<div class="lbl" style="margin:0">Meals</div>
${isToday ? `<button onclick="app.sheet('addcat')" style="width:30px;height:30px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 15)}</button>` : ''}
</div>
<div class="scrollrow" style="margin-bottom:16px">${catTabs}</div>
${isToday ? `<div class="card" style="margin-bottom:22px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
<div><div style="font-size:15px;font-weight:800;color:${C.ink}">${esc(activeCat.label)}</div>
<div style="font-size:12px;color:${C.sub}">${activeItems.reduce((s, i) => s + i.cal, 0)} kcal · ${activeItems.length} items</div></div>
<button onclick="app.sheet('editcat','${activeCat.id}')" style="width:34px;height:34px;border-radius:50%;background:${C.brandSoft};display:flex;align-items:center;justify-content:center">${ic('edit', C.brand, 14)}</button>
</div>
${itemRows}
<button onclick="app.goAddFood('${activeCat.id}')" style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;margin-top:10px;color:${C.brand};cursor:pointer">
${ic('plus', C.brand, 14)} Add food to ${esc(activeCat.label)}</button>
</div>` : `<div class="card" style="text-align:center;margin-bottom:22px;background:${C.sage}">
<div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:4px">Viewing a past day</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:14px">Item detail is only available for today.</div>
<button onclick="app.goToday()" style="padding:10px 22px;border-radius:22px;font-size:12px;font-weight:700;background:${C.action};color:#fff">Back to today</button>
</div>`}
<div class="lbl">Meal kcal</div>
<div class="card" style="margin-bottom:26px">${barChart(chartData, 'app.selCatIdx')}</div>`;
}

// ─── PROGRESS ENGINE ──────────────────────────────────────────────────────
function renderEngine(state) {
  const u = state.user;
  const wc = weightChanges(u);
  const avg = weeklyAverages(state.cache);
  const t = u.targets;
  const points = (Array.isArray(u.weightLog) && u.weightLog.length ? u.weightLog : [{ d: dKey(0), kg: u.weight }]).slice(-12);
  const streak = state.streak || 0;

  const deltaStr = (v, unit = 'kg') => (v > 0 ? `+${v}` : `${v}`) + unit;
  const lostWeight = wc.sinceStart < 0;

  return `
<div style="height:1px;background:${C.border};margin:4px 0 22px"></div>
<div style="font-size:20px;font-weight:800;color:${C.ink};margin-bottom:4px">Your progress</div>
<div style="font-size:13px;color:${C.sub};margin-bottom:18px">Trends across your wellness journey</div>

<div class="card-white" style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
<div style="width:62px;height:62px;border-radius:20px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center">${ic('flame', C.brand, 30)}</div>
<div style="flex:1">
<div style="display:flex;align-items:baseline;gap:6px"><div style="font-size:30px;font-weight:800;color:${C.ink}">${streak}</div><div style="font-size:14px;font-weight:700;color:${C.sub}">day${streak === 1 ? '' : 's'}</div></div>
<div style="font-size:13px;color:${C.sub};margin-top:2px">${streak > 0 ? 'Logging streak — keep the flame alive!' : 'Log a food today to start your streak.'}</div>
</div>
</div>

<div class="lbl">Weight progress</div>
<div class="card-white" style="margin-bottom:16px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div><div style="font-size:24px;font-weight:800;color:${C.ink}">${wc.current}<span style="font-size:14px;font-weight:600;color:${C.sub}"> kg</span></div>
<div style="font-size:12px;color:${C.sub}">Target ${wc.target} kg</div></div>
<button onclick="app.sheet('updateweight')" style="display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:22px;background:${C.action};color:#fff;font-size:12px;font-weight:700">${ic('scale', '#fff', 15)} Log weight</button>
</div>
${points.length > 1 ? lineChart(points, { target: wc.target }) : `<div style="padding:24px 12px;text-align:center;font-size:12px;color:${C.sub};background:${C.cardSoft};border-radius:16px">Log your weight a few times to see your trend line.</div>`}
</div>

<div class="lbl">Weight changes</div>
<div class="grid3" style="margin-bottom:16px">
<div class="card" style="text-align:center"><div style="font-size:16px;font-weight:800;color:${lostWeight ? C.action : C.ink}">${deltaStr(wc.sinceStart)}</div><div style="font-size:10px;color:${C.sub};margin-top:2px">Since start</div></div>
<div class="card" style="text-align:center"><div style="font-size:16px;font-weight:800;color:${C.ink}">${deltaStr(wc.sinceLast)}</div><div style="font-size:10px;color:${C.sub};margin-top:2px">Last change</div></div>
<div class="card" style="text-align:center"><div style="font-size:16px;font-weight:800;color:${C.brand}">${deltaStr(wc.toTarget)}</div><div style="font-size:10px;color:${C.sub};margin-top:2px">To target</div></div>
</div>

<div class="lbl">7-day averages</div>
<div class="grid2" style="margin-bottom:16px">
<div class="card-white"><div style="font-size:22px;font-weight:800;color:${C.brand}">${avg.avgCal}</div><div style="font-size:11px;color:${C.sub};margin-top:2px">Avg calories</div>
<div style="font-size:11px;color:${avg.avgCal && avg.avgCal <= t.cal ? C.action : C.sub};margin-top:6px">${avg.days ? `vs ${t.cal} goal` : 'No data yet'}</div></div>
<div class="card-white"><div style="font-size:22px;font-weight:800;color:${C.action}">${avg.avgPro}g</div><div style="font-size:11px;color:${C.sub};margin-top:2px">Avg protein</div>
<div style="font-size:11px;color:${avg.avgPro >= t.pro ? C.action : C.sub};margin-top:6px">${avg.days ? `vs ${t.pro}g goal` : 'No data yet'}</div></div>
</div>
<div style="font-size:11px;color:${C.sub};text-align:center;margin-bottom:8px">${avg.days ? `Averaged over ${avg.days} logged day${avg.days === 1 ? '' : 's'} this week.` : 'Averages appear once you log a few days.'}</div>

<button onclick="app.sheet('adjustgoal')" class="btn" style="background:${C.card};color:${C.ink}">Adjust daily goals</button>`;
}
