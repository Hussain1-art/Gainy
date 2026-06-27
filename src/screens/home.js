import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { weekCalendarHTML } from '../lib/ui.js';
import { sumLog, dKey, dFull, esc } from '../lib/helpers.js';

// ─── HORIZONTAL PROGRESS BAR ─────────────────────────────────────────────
function hBar(pct, fg = '#fff', bg = 'rgba(255,255,255,.28)', h = 8) {
  const w = Math.min(100, Math.max(0, pct));
  return `<div style="width:100%;height:${h}px;border-radius:${h}px;background:${bg};overflow:hidden;margin:6px 0">
<div style="height:100%;width:${w}%;background:${fg};border-radius:${h}px;transition:width .4s ease"></div>
</div>`;
}

// ─── TEARDROP FLAME MASCOT (matches screenshot) ────────────────────────────
const flameSVG = `<svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="30" cy="66" rx="14" ry="4" fill="rgba(0,0,0,.15)"/>
<!-- Body: teardrop shape -->
<path d="M30 4C30 4 8 28 8 44C8 56 18 64 30 64C42 64 52 56 52 44C52 28 30 4 30 4Z" fill="#FFAA20"/>
<path d="M30 4C30 4 18 24 18 40C18 50 23 58 30 62C37 58 42 50 42 40C42 24 30 4 30 4Z" fill="#FFCC55"/>
<!-- Inner highlight -->
<path d="M30 16C30 16 22 32 22 42C22 48 25.5 54 30 56C34.5 54 38 48 38 42C38 32 30 16 30 16Z" fill="#FFE085" opacity="0.5"/>
<!-- Eyes -->
<ellipse cx="23" cy="44" rx="5" ry="5.5" fill="white"/>
<ellipse cx="37" cy="44" rx="5" ry="5.5" fill="white"/>
<circle cx="23.5" cy="45" r="2.5" fill="#1a1a1a"/>
<circle cx="37.5" cy="45" r="2.5" fill="#1a1a1a"/>
<circle cx="24.5" cy="44" r="1" fill="white"/>
<circle cx="38.5" cy="44" r="1" fill="white"/>
<!-- Smile -->
<path d="M25 53C25 53 27.5 56 30 56C32.5 56 35 53 35 53" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// ─── MACRO CHIP (outside hero, on cream bg) ────────────────────────────────
function macroChip(icon, label, cur, goal) {
  const pct = Math.min(100, Math.round((cur / goal) * 100));
  return `<div style="flex-shrink:0;background:${C.card};border-radius:18px;padding:12px 14px;min-width:88px;text-align:center">
<div style="font-size:22px;margin-bottom:4px">${icon}</div>
<div style="font-size:10px;font-weight:700;color:${C.brand};margin-bottom:2px">${label}</div>
<div style="font-size:11px;font-weight:700;color:${C.ink}">${cur}/${goal}g</div>
<div style="width:100%;height:4px;border-radius:4px;background:${C.border};overflow:hidden;margin-top:6px">
  <div style="height:100%;width:${pct}%;background:${C.brand};border-radius:4px;transition:width .4s"></div>
</div>
</div>`;
}

// ─── MEAL ROW ────────────────────────────────────────────────────────────
function mealRow(state, cat, isToday) {
  const items = isToday ? (state.log.meals[cat.id] || []) : [];
  const kcal = items.reduce((s, i) => s + i.cal, 0);
  const hasItems = items.length > 0;
  const extraCount = items.length > 1 ? items.length - 1 : 0;
  const mealLabel = hasItems
    ? (esc(items[0].name) + (extraCount > 0 ? ` +${extraCount}` : ''))
    : `Add ${esc(cat.label).toLowerCase()}`;
  const kcalStr = hasItems
    ? `<span style="font-size:14px;font-weight:800;color:${C.ink}">${kcal} kcal</span>`
    : `<span style="font-size:13px;color:${C.sub}">— kcal</span>`;
  const checkEl = hasItems
    ? `<div style="width:26px;height:26px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('check','#fff',12)}</div>`
    : `<div style="width:26px;height:26px;border-radius:50%;border:1.5px solid ${C.border};flex-shrink:0"></div>`;

  return `<button onclick="app.goAddFood('${cat.id}')" style="width:100%;display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid ${C.border};text-align:left;cursor:pointer">
<div style="width:42px;height:42px;border-radius:13px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${cat.icon}</div>
<div style="flex:1;min-width:0">
  <div style="font-size:14px;font-weight:800;color:${C.ink}">${esc(cat.label)}</div>
  <div style="font-size:12px;color:${C.sub};margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mealLabel}</div>
</div>
<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
  ${kcalStr}
  ${checkEl}
  ${ic('chevR', C.sub, 13)}
</div>
</button>`;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────
export function renderHome(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const pct = Math.min(100, Math.round((sum.cal / t.cal) * 100));
  const rem = Math.max(0, t.cal - sum.cal);
  const proLeft = Math.max(0, Math.round(t.pro - sum.pro));

  const heroTitle = isToday
    ? (rem > 0 ? "You're on track today" : 'Goal hit! 🎉')
    : `Viewing ${dFull(Math.round((new Date(state.selDate) - new Date(dKey(0))) / 86400000))}`;

  const tipText = proLeft > 0
    ? `${proLeft}g of protein to go — a shake or yoghurt closes the gap.`
    : 'Protein goal reached — great balanced day! 🎉';

  const mealRows = state.cats.map(c => mealRow(state, c, isToday)).join('');

  return `
<!-- HEADER -->
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
<div>
  <div style="font-size:13px;color:${C.sub}">Welcome back,</div>
  <div style="font-size:26px;font-weight:800;color:${C.ink}">${esc(state.user.name)} 👋</div>
</div>
<div style="display:flex;gap:8px">
  <button onclick="app.sheet('quickadd')" style="width:46px;height:46px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus','#fff',20)}</button>
  <button onclick="app.sheet('reminders')" style="width:46px;height:46px;border-radius:50%;background:${C.white};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">${ic('bell',C.ink,18)}</button>
</div>
</div>

${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}

<div style="font-size:19px;font-weight:800;color:${C.ink};margin-bottom:12px">${heroTitle}</div>

<!-- HERO CARD -->
<div style="width:100%;border-radius:26px;padding:20px;margin-bottom:0;background:${C.brand};box-shadow:0 10px 32px rgba(239,115,5,.28)">
  <div style="display:flex;align-items:flex-start;justify-content:space-between">
    <div>
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.05em;margin-bottom:4px">Today's progress</div>
      <div style="font-size:52px;font-weight:900;color:#fff;line-height:1">${sum.cal}</div>
      <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.8);margin-top:3px">kcal logged</div>
    </div>
    <div style="margin-top:-6px;filter:drop-shadow(0 6px 12px rgba(0,0,0,.2))">${flameSVG}</div>
  </div>

  <!-- Left / Goal pills -->
  <div style="display:flex;gap:8px;margin-top:16px">
    <div style="flex:1;background:rgba(255,255,255,.2);border-radius:14px;padding:10px 14px">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:2px">left</div>
      <div style="font-size:24px;font-weight:900;color:#fff">${rem}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.65)">kcal</div>
    </div>
    <div style="flex:1;background:rgba(255,255,255,.2);border-radius:14px;padding:10px 14px">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:2px">Goal</div>
      <div style="font-size:24px;font-weight:900;color:#fff">${t.cal}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.65)">kcal</div>
    </div>
  </div>

  <!-- Progress bar -->
  <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.65);margin-top:12px">
    <span>0 kcal eaten</span><span>${t.cal} kcal goal</span>
  </div>
  ${hBar(pct, '#fff', 'rgba(255,255,255,.25)', 9)}
  <div style="text-align:center;font-size:11px;font-weight:800;color:rgba(255,255,255,.9);margin-top:3px">${pct}%</div>
</div>

<!-- SCROLLABLE MACRO CHIPS — outside hero, cream background -->
<div style="display:flex;gap:8px;overflow-x:auto;padding:14px 0 2px;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-bottom:14px">
  ${macroChip('🍗','protein', Math.round(sum.pro), t.pro)}
  ${macroChip('🍞','carbs', Math.round(sum.carb), t.carb)}
  ${macroChip('🥑','fats', Math.round(sum.fat), t.fat)}
  ${macroChip('🧂','sodium', 0, 2300)}
  ${macroChip('💊','vitamins', 0, 100)}
  ${macroChip('💧','water', 0, 2500)}
</div>

<!-- TODAY'S FOCUS -->
<div style="display:flex;align-items:center;gap:14px;border-radius:20px;padding:15px 16px;margin-bottom:12px;background:${C.brandSoft}">
  <div style="width:38px;height:38px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('bulb',C.brand,18)}</div>
  <div style="flex:1">
    <div style="font-size:13px;font-weight:800;color:${C.brand};margin-bottom:2px">Today's Focus</div>
    <div style="font-size:13px;color:${C.sub};line-height:1.4">${tipText}</div>
  </div>
</div>

<!-- PREMIUM BANNER -->
<div style="border-radius:20px;padding:18px 18px;margin-bottom:20px;background:${C.warm};text-align:center">
  <div style="font-size:14px;font-weight:800;color:${C.brand}">Go Premium.</div>
  <div style="font-size:12px;color:${C.sub};margin-top:3px">Unlock deeper insights and smarter nutrition tracking.</div>
  <button style="margin-top:12px;padding:10px 24px;border-radius:24px;background:${C.brand};color:#fff;font-size:13px;font-weight:700">Try 7 days free →</button>
</div>

<!-- DAILY ROUTINE -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
  <div style="font-size:16px;font-weight:800;color:${C.ink}">Daily Routine</div>
  <button onclick="app.sheet('addcat')" style="width:32px;height:32px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus','#fff',15)}</button>
</div>
<div style="background:${C.white};border-radius:20px;padding:0 16px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
${mealRows}
<div style="height:4px"></div>
</div>`;
}
