import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing, weekCalendarHTML, barChart, sheetHd } from '../lib/ui.js';
import { sumLog, dKey, dDay, dFull, goalHit } from '../lib/helpers.js';

// Progress tab has two internal sub-views: "log" (today's meals, was Fuel)
// and "trends" (charts + goal timeline, was Analytics). A pill switcher
// at the top toggles between them, keeping everything under one bottom tab.

export function renderProgress(state) {
  const sub = state.progressSub || 'log';
  const switcher = `<div style="display:flex;gap:8px;margin-bottom:16px">
<button onclick="app.progressSub('log')" style="flex:1;padding:10px;border-radius:14px;font-size:13px;font-weight:700;background:${sub === 'log' ? C.blue : C.card};color:${sub === 'log' ? '#fff' : C.ink};border:1px solid ${sub === 'log' ? C.blue : C.border}">Today's log</button>
<button onclick="app.progressSub('trends')" style="flex:1;padding:10px;border-radius:14px;font-size:13px;font-weight:700;background:${sub === 'trends' ? C.blue : C.card};color:${sub === 'trends' ? '#fff' : C.ink};border:1px solid ${sub === 'trends' ? C.blue : C.border}">Trends</button>
</div>`;

  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
<div><div style="font-size:11px;font-weight:700;color:${C.blue}">GAINY</div><div style="font-size:24px;font-weight:800;color:${C.ink}">Progress</div></div>
${sub === 'log' ? `<button onclick="app.sheet('scanner')" style="width:40px;height:40px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('cam', C.blue)}</button>` : ''}
</div>
${switcher}
${sub === 'log' ? renderLogSection(state) : renderTrendsSection(state)}`;
}

// ─── LOG SECTION (formerly Fuel tab) ──────────────────────────────────────
function renderLogSection(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const rem = t.cal - sum.cal;

  const catTabs = state.cats.map(c => {
    const kcal = isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0;
    const active = c.id === state.selCat;
    return `<button onclick="app.selCat('${c.id}')" style="flex-shrink:0;border-radius:16px;padding:10px 16px;text-align:left;background:${active ? C.blue : C.card};border:1px solid ${active ? C.blue : C.border};cursor:pointer">
<div style="font-size:12px;font-weight:700;color:${active ? '#fff' : C.ink}">${c.icon} ${c.label}</div>
<div style="font-size:11px;margin-top:2px;color:${active ? 'rgba(255,255,255,.75)' : C.sub}">${kcal} kcal</div>
</button>`;
  }).join('');

  const activeCat = state.cats.find(c => c.id === state.selCat) || state.cats[0];
  const activeItems = isToday ? (state.log.meals[state.selCat] || []) : [];
  const itemRows = activeItems.map(it => `<button onclick="app.editFood('${state.selCat}','${it.id}')" style="width:100%;display:flex;justify-content:space-between;font-size:12px;padding:8px 0;border-top:1px solid ${C.border};color:${C.sub};text-align:left;cursor:pointer">
<span>${it.name} <span style="color:#C8D2EC">· ${it.serving}</span></span>
<span style="font-weight:600;color:${C.ink}">${it.cal} kcal</span>
</button>`).join('');

  const chartData = state.cats.map(c => ({ label: c.label, v: isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0, color: c.id === state.selCat ? C.blue : C.ice }));

  return `
${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}
<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px">
${donutRing([
    { v: sum.cal, max: t.cal, color: C.blue, bg: C.blueSoft },
    { v: sum.pro, max: t.pro, color: C.blue, bg: C.blueSoft },
    { v: sum.carb, max: t.carb, color: C.sky, bg: C.blueSoft },
    { v: sum.fat, max: t.fat, color: C.blueDark, bg: C.blueSoft },
  ], 150, sum.cal, 'kcal logged')}
<div style="font-size:12px;font-weight:600;margin-top:8px;color:${rem >= 0 ? C.blue : C.blueDark}">${rem >= 0 ? rem + ' kcal left' : Math.abs(rem) + ' kcal over goal'}</div>
</div>
<div class="grid3" style="margin-bottom:20px">
<div class="card" style="text-align:center"><div style="font-size:14px;font-weight:700;color:${C.blue}">${Math.round(sum.pro)}g</div><div style="font-size:10px;color:${C.sub}">Protein /${t.pro}g</div></div>
<div class="card" style="text-align:center"><div style="font-size:14px;font-weight:700;color:${C.sky}">${Math.round(sum.carb)}g</div><div style="font-size:10px;color:${C.sub}">Carbs /${t.carb}g</div></div>
<div class="card" style="text-align:center"><div style="font-size:14px;font-weight:700;color:${C.blueDark}">${Math.round(sum.fat)}g</div><div style="font-size:10px;color:${C.sub}">Fat /${t.fat}g</div></div>
</div>
<div class="section-hd">
<div class="lbl" style="margin:0">Meals</div>
${isToday ? `<button onclick="app.sheet('addcat')" style="width:28px;height:28px;border-radius:50%;background:${C.blue};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 14)}</button>` : ''}
</div>
<div class="scrollrow" style="margin-bottom:16px">${catTabs}</div>
${isToday ? `<div class="card" style="margin-bottom:20px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div><div style="font-size:14px;font-weight:700;color:${C.ink}">${activeCat.label}</div>
<div style="font-size:12px;color:${C.sub}">${activeItems.reduce((s, i) => s + i.cal, 0)} kcal · ${activeItems.length} items</div></div>
<button onclick="app.sheet('editcat','${activeCat.id}')" style="width:32px;height:32px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('edit', C.blue, 14)}</button>
</div>
${itemRows}
<button onclick="app.goAddFood('${activeCat.id}')" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;margin-top:8px;color:${C.blue};cursor:pointer">
${ic('plus', C.blue, 13)} Add food to ${activeCat.label}</button>
</div>` : `<div class="card" style="text-align:center;margin-bottom:20px;background:${C.blueSoft}">
<div style="font-size:14px;font-weight:600;color:${C.ink};margin-bottom:4px">Viewing a past day</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:12px">Item detail is only available for today.</div>
<button onclick="app.goToday()" style="padding:8px 20px;border-radius:20px;font-size:12px;font-weight:700;background:${C.blue};color:#fff">Back to today</button>
</div>`}
<div class="lbl">Meal kcal</div>
<div class="card">${barChart(chartData, 'app.selCatIdx')}</div>`;
}

// ─── TRENDS SECTION (formerly Analytics tab) ──────────────────────────────
function renderTrendsSection(state) {
  const hist = [];
  for (let o = -6; o <= 0; o++) {
    const k = dKey(o);
    const s = state.cache[k] || { cal: 0, pro: 0, carb: 0, fat: 0 };
    hist.push({ ...s, label: dDay(o), date: dFull(o), isT: o === 0, k });
  }
  const ins = state.sheetData.inspected ?? hist.length - 1;
  const day = hist[ins] || hist[hist.length - 1];
  const t = state.user.targets;
  const avgCal = Math.round(hist.reduce((s, h) => s + h.cal, 0) / hist.length) || 0;
  const avgPro = Math.round(hist.reduce((s, h) => s + h.pro, 0) / hist.length) || 0;
  const calAdh = Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgCal - t.cal) / t.cal * 100)));
  const proAdh = Math.max(0, Math.min(100, Math.round(100 - Math.abs(avgPro - t.pro) / t.pro * 100)));
  const span = state.user.tWeight - state.user.startWeight;
  let wPct = Math.abs(span) > 0.01 ? Math.round((state.user.weight - state.user.startWeight) / span * 100) : Math.max(0, 100 - Math.abs(state.user.weight - state.user.tWeight) * 10);
  wPct = Math.max(0, Math.min(100, wPct));
  const cData = hist.map((h, i) => ({ label: h.label, v: h.cal, color: i === ins ? C.blue : goalHit(h, t) ? C.sky : C.ice }));
  const rem = t.cal - (day?.cal || 0);

  const progRow = (label, pct, onclick) => `<button onclick="${onclick}" style="width:100%;display:flex;align-items:center;justify-content:space-between;border-radius:16px;padding:12px 16px;margin-bottom:8px;background:${C.card};border:1px solid ${C.border};text-align:left;cursor:pointer">
<div style="font-size:14px;font-weight:600;width:70px;flex-shrink:0;color:${C.ink}">${label}</div>
<div style="flex:1;height:8px;border-radius:4px;margin:0 12px;background:${C.blueSoft}">
<div style="height:100%;border-radius:4px;width:${Math.min(100, Math.max(0, pct))}%;background:${C.blue}"></div></div>
<div style="font-size:12px;font-weight:700;width:40px;text-align:right;color:${C.blue}">${Math.round(pct)}%</div>
</button>`;

  return `
<div class="card" style="margin-bottom:12px">
<div class="lbl">Goal progress · 7 days</div>
${barChart(cData, 'app.inspect')}
<div style="display:flex;gap:12px;font-size:11px;margin-top:8px;color:${C.sub}">
<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:${C.blue};display:inline-block"></span>Inspecting</span>
<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:${C.sky};display:inline-block"></span>Goal hit</span>
<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:${C.ice};display:inline-block"></span>Off target</span>
</div></div>
${day ? `<div style="border-radius:16px;padding:16px;margin-bottom:20px;background:${C.blueSoft}">
<div style="font-size:20px;font-weight:800;color:${C.ink}">${day.cal} kcal</div>
<div style="font-size:12px;margin-top:4px;color:${C.sub}">${day.date} · ${rem >= 0 ? rem + ' kcal remaining' : Math.abs(rem) + ' kcal over'} vs ${t.cal} kcal goal</div>
<div style="display:flex;gap:16px;font-size:12px;margin-top:8px;color:${C.sub}">
<span><b style="color:${C.blue}">${Math.round(day.pro)}g</b> protein</span>
<span><b style="color:${C.sky}">${Math.round(day.carb)}g</b> carbs</span>
<span><b style="color:${C.blueDark}">${Math.round(day.fat)}g</b> fat</span>
</div></div>` : ''}
<div class="lbl">Goal timeline</div>
${progRow('Weight', wPct, 'app.sheet("updateweight")')}
${progRow('Protein', proAdh, 'void(0)')}
${progRow('Calories', calAdh, 'void(0)')}
<div style="font-size:11px;margin-top:4px;margin-bottom:20px;line-height:1.6;color:${C.sub}">Weight: ${state.user.weight}kg → ${state.user.tWeight}kg goal. Tap Weight to update. Protein &amp; Calories show 7-day average vs target.</div>
<button onclick="app.sheet('adjustgoal')" class="btn" style="background:${C.blueSoft};color:${C.blue}">Adjust calorie goal</button>`;
}
