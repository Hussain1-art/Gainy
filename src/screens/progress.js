import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing, weekCalendarHTML, barChart } from '../lib/ui.js';
import { sumLog, dKey, esc } from '../lib/helpers.js';

// Progress is a single scrollable page:
//   1. Date selector  2. Macros  3. Meal sections (today's log)
//   4. Insight sections (Weight Progress, Weight Changes, Average Calories,
//      Average Protein, Streaks) — placeholders for now, chart logic TBD.

export function renderProgress(state) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
<div><div style="font-size:11px;font-weight:700;color:${C.blue}">GAINY</div><div style="font-size:24px;font-weight:800;color:${C.ink}">Progress</div></div>
<button onclick="app.sheet('scanner')" style="width:40px;height:40px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('cam', C.blue)}</button>
</div>
${renderLogSection(state)}
${renderInsights()}`;
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
    return `<button onclick="app.selCat('${c.id}')" style="flex-shrink:0;border-radius:16px;padding:10px 16px;text-align:left;background:${active ? C.blue : C.card};border:1px solid ${active ? C.blue : C.border};cursor:pointer">
<div style="font-size:12px;font-weight:700;color:${active ? '#fff' : C.ink}">${c.icon} ${esc(c.label)}</div>
<div style="font-size:11px;margin-top:2px;color:${active ? 'rgba(255,255,255,.75)' : C.sub}">${kcal} kcal</div>
</button>`;
  }).join('');

  const activeCat = state.cats.find(c => c.id === state.selCat) || state.cats[0];
  const activeItems = isToday ? (state.log.meals[state.selCat] || []) : [];
  const itemRows = activeItems.map(it => `<button onclick="app.editFood('${state.selCat}','${it.id}')" style="width:100%;display:flex;justify-content:space-between;font-size:12px;padding:8px 0;border-top:1px solid ${C.border};color:${C.sub};text-align:left;cursor:pointer">
<span>${esc(it.name)} <span style="color:#C8D2EC">· ${esc(it.serving)}</span></span>
<span style="font-weight:600;color:${C.ink}">${it.cal} kcal</span>
</button>`).join('');

  const chartData = state.cats.map(c => ({ label: esc(c.label), v: isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0, color: c.id === state.selCat ? C.blue : C.ice }));

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
<div><div style="font-size:14px;font-weight:700;color:${C.ink}">${esc(activeCat.label)}</div>
<div style="font-size:12px;color:${C.sub}">${activeItems.reduce((s, i) => s + i.cal, 0)} kcal · ${activeItems.length} items</div></div>
<button onclick="app.sheet('editcat','${activeCat.id}')" style="width:32px;height:32px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('edit', C.blue, 14)}</button>
</div>
${itemRows}
<button onclick="app.goAddFood('${activeCat.id}')" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;margin-top:8px;color:${C.blue};cursor:pointer">
${ic('plus', C.blue, 13)} Add food to ${esc(activeCat.label)}</button>
</div>` : `<div class="card" style="text-align:center;margin-bottom:20px;background:${C.blueSoft}">
<div style="font-size:14px;font-weight:600;color:${C.ink};margin-bottom:4px">Viewing a past day</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:12px">Item detail is only available for today.</div>
<button onclick="app.goToday()" style="padding:8px 20px;border-radius:20px;font-size:12px;font-weight:700;background:${C.blue};color:#fff">Back to today</button>
</div>`}
<div class="lbl">Meal kcal</div>
<div class="card" style="margin-bottom:24px">${barChart(chartData, 'app.selCatIdx')}</div>`;
}

// ─── INSIGHTS (placeholder sections — chart logic TBD) ────────────────────
function renderInsights() {
  const sections = [
    { title: 'Weight Progress', sub: 'Your weight trend toward your goal', icon: 'progress' },
    { title: 'Weight Changes', sub: 'How your weight has moved over time', icon: 'progress' },
    { title: 'Average Calories', sub: '7-day calorie average vs target', icon: 'progress' },
    { title: 'Average Protein', sub: '7-day protein average vs target', icon: 'progress' },
    { title: 'Streaks', sub: 'Days in a row you hit your goal', icon: 'check' },
  ];

  const cards = sections.map(s => `<div class="lbl">${s.title}</div>
<div class="card" style="margin-bottom:16px;padding:0">
<div style="height:128px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-radius:16px;background:${C.blueSoft};border:1px dashed ${C.ice}">
<div style="width:40px;height:40px;border-radius:12px;background:${C.card};display:flex;align-items:center;justify-content:center">${ic(s.icon, C.blue, 18)}</div>
<div style="font-size:13px;font-weight:700;color:${C.ink}">${s.title}</div>
<div style="font-size:11px;color:${C.sub};text-align:center;max-width:240px">${s.sub} · Coming soon</div>
</div></div>`).join('');

  return `<div style="height:1px;background:${C.border};margin:8px 0 20px"></div>
<div style="font-size:18px;font-weight:800;color:${C.ink};margin-bottom:4px">Insights</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:16px">Trends and progress over time</div>
${cards}`;
}
