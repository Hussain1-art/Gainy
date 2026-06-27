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

// ─── MACRO CHIP (scrollable row) ──────────────────────────────────────────
function macroChip(icon, label, cur, goal) {
  const pct = Math.min(100, Math.round((cur / goal) * 100));
  return `<div style="flex-shrink:0;background:rgba(255,255,255,.18);border-radius:14px;padding:9px 12px;min-width:90px">
<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
  <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:14px">${icon}</div>
  <div>
    <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.8)">${label}</div>
    <div style="font-size:12px;font-weight:800;color:#fff">${cur} / ${goal}g</div>
  </div>
</div>
${hBar(pct, '#fff', 'rgba(255,255,255,.25)', 4)}
</div>`;
}

// ─── MEAL ROW ────────────────────────────────────────────────────────────
function mealRow(state, cat, isToday) {
  const items = isToday ? (state.log.meals[cat.id] || []) : [];
  const kcal = items.reduce((s, i) => s + i.cal, 0);
  const hasItems = items.length > 0;
  const firstItem = hasItems ? esc(items[0].name) : null;
  const extraCount = items.length > 1 ? items.length - 1 : 0;

  const mealLabel = hasItems
    ? (firstItem + (extraCount > 0 ? ` +${extraCount}` : ''))
    : `Add ${esc(cat.label).toLowerCase()}`;

  const kcalStr = hasItems
    ? `<span style="font-size:15px;font-weight:800;color:${C.ink}">${kcal} kcal</span>`
    : `<span style="font-size:13px;color:${C.sub}">— kcal</span>`;

  const checkEl = hasItems
    ? `<div style="width:28px;height:28px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('check','#fff',13)}</div>`
    : `<div style="width:28px;height:28px;border-radius:50%;border:2px solid ${C.border};flex-shrink:0"></div>`;

  return `<button onclick="app.goAddFood('${cat.id}')" style="width:100%;display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid ${C.border};text-align:left;cursor:pointer">
<div style="width:44px;height:44px;border-radius:14px;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${cat.icon}</div>
<div style="flex:1;min-width:0">
  <div style="font-size:14px;font-weight:800;color:${C.ink}">${esc(cat.label)}</div>
  <div style="font-size:12px;color:${C.sub};margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mealLabel}</div>
</div>
<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
${kcalStr}
${checkEl}
${ic('chevR', C.sub, 14)}
</div>
</button>`;
}

// ─── 3D FLAME ICON ────────────────────────────────────────────────────────
const flameSVG = `<svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="32" cy="68" rx="16" ry="4" fill="rgba(0,0,0,.18)"/>
<path d="M32 4C32 4 16 20 16 38C16 49 23 57 32 57C41 57 48 49 48 38C48 20 32 4 32 4Z" fill="#FF9500"/>
<path d="M32 10C32 10 22 24 22 36C22 43 26.5 48 32 48C37.5 48 42 43 42 36C42 24 32 10 32 10Z" fill="#FFCC00"/>
<path d="M32 26C32 26 27 31 27 36C27 39.3 29.2 42 32 42C34.8 42 37 39.3 37 36C37 31 32 26 32 26Z" fill="white" opacity="0.5"/>
<circle cx="26" cy="35" r="4" fill="white"/>
<circle cx="38" cy="35" r="4" fill="white"/>
<circle cx="26" cy="36" r="2" fill="#1a1a1a"/>
<circle cx="38" cy="36" r="2" fill="#1a1a1a"/>
<circle cx="27" cy="35" r="0.8" fill="white"/>
<circle cx="39" cy="35" r="0.8" fill="white"/>
<path d="M28 44C28 44 29.5 46 32 46C34.5 46 36 44 36 44" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

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
  <button onclick="app.sheet('quickadd')" style="width:46px;height:46px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center" class="soft">${ic('plus','#fff',20)}</button>
  <button onclick="app.sheet('reminders')" style="width:46px;height:46px;border-radius:50%;background:${C.white};display:flex;align-items:center;justify-content:center" class="soft">${ic('bell',C.ink,18)}</button>
</div>
</div>

${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}

<div style="font-size:18px;font-weight:800;color:${C.ink};margin-bottom:12px">${heroTitle}</div>

<!-- HERO CARD — matches screenshot exactly -->
<div style="width:100%;border-radius:26px;padding:20px;margin-bottom:14px;background:${C.brand};box-shadow:0 10px 32px rgba(239,115,5,.3)">

  <!-- Top label + flame -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between">
    <div>
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.05em;margin-bottom:4px">Today's progress</div>
      <div style="font-size:48px;font-weight:900;color:#fff;line-height:1">${sum.cal}</div>
      <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.8);margin-top:2px">kcal logged</div>
    </div>
    <div style="margin-top:-4px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25))">${flameSVG}</div>
  </div>

  <!-- Left / Goal split row -->
  <div style="display:flex;gap:8px;margin-top:14px;margin-bottom:4px">
    <div style="flex:1;background:rgba(255,255,255,.18);border-radius:14px;padding:10px 14px">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:2px">left</div>
      <div style="font-size:22px;font-weight:900;color:#fff">${rem}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.7)">kcal</div>
    </div>
    <div style="flex:1;background:rgba(255,255,255,.18);border-radius:14px;padding:10px 14px">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:2px">Goal</div>
      <div style="font-size:22px;font-weight:900;color:#fff">${t.cal}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.7)">kcal</div>
    </div>
  </div>

  <!-- Progress bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.7);margin-top:10px">
    <span>0 kcal eaten</span><span>${t.cal} kcal goal</span>
  </div>
  ${hBar(pct, '#fff', 'rgba(255,255,255,.28)', 9)}
  <div style="text-align:center;font-size:11px;font-weight:700;color:rgba(255,255,255,.9);margin-top:3px">${pct}%</div>

  <!-- Scrollable macro chips -->
  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;margin-top:14px;scrollbar-width:none" class="scrollrow">
    ${macroChip('🍗','Protein', Math.round(sum.pro), t.pro)}
    ${macroChip('🍞','Carbs', Math.round(sum.carb), t.carb)}
    ${macroChip('🥑','Fat', Math.round(sum.fat), t.fat)}
    ${macroChip('🧂','Sodium', 0, 2300)}
    ${macroChip('💊','Vitamins', 0, 100)}
  </div>
</div>

<!-- TODAY'S TIP -->
<div style="display:flex;align-items:center;gap:14px;border-radius:20px;padding:16px 18px;margin-bottom:12px;background:${C.brandSoft}">
<div style="width:40px;height:40px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('bulb',C.brand,20)}</div>
<div style="flex:1">
  <div style="font-size:13px;font-weight:800;color:${C.brand};margin-bottom:2px">Today's Focus</div>
  <div style="font-size:13px;color:${C.sub};line-height:1.4">${tipText}</div>
</div>
</div>

<!-- PREMIUM BANNER (AD SPACE style from screenshot) -->
<div style="border-radius:20px;padding:18px 16px;margin-bottom:20px;background:${C.warm};text-align:center">
<div style="font-size:13px;font-weight:800;color:${C.brand}">Go Premium.</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">Unlock deeper insights and smarter nutrition tracking.</div>
<button style="margin-top:10px;padding:9px 20px;border-radius:22px;background:${C.brand};color:#fff;font-size:12px;font-weight:700">Try 7 days free →</button>
</div>

<!-- DAILY MEALS -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div style="font-size:15px;font-weight:800;color:${C.ink}">Daily Routine</div>
<button onclick="app.sheet('addcat')" style="width:30px;height:30px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus','#fff',15)}</button>
</div>
<div style="background:${C.white};border-radius:20px;padding:0 16px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
${mealRows}
<div style="height:4px"></div>
</div>`;
}
