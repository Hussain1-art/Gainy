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

// ─── MACRO PILL ──────────────────────────────────────────────────────────
function macroPill(emoji, label, cur, goal, fg, bg) {
  const pct = Math.round((cur / goal) * 100);
  return `<div style="flex:1;background:${bg};border-radius:16px;padding:10px 10px 8px">
<div style="font-size:15px;margin-bottom:2px">${emoji}</div>
<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.85)">${label}</div>
<div style="font-size:13px;font-weight:800;color:#fff;margin-top:1px">${cur}/${goal}g</div>
${hBar(pct, '#fff', 'rgba(255,255,255,.3)', 5)}
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

  const kcalStr = hasItems ? `<span style="font-size:15px;font-weight:800;color:${C.ink}">${kcal} kcal</span>` : `<span style="font-size:13px;color:${C.sub}">— kcal</span>`;

  const checkEl = hasItems
    ? `<div style="width:28px;height:28px;border-radius:50%;background:${C.action};display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('check','#fff',13)}</div>`
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

// ─── MEAL BAR CHART ──────────────────────────────────────────────────────
function mealBarChart(state, cats, isToday) {
  const data = cats.map(c => ({
    label: c.label,
    v: isToday ? (state.log.meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0,
    color: c.id === 'breakfast' ? C.gold : c.id === 'lunch' ? '#a8c77a' : c.id === 'dinner' ? '#c39bd3' : C.warm,
  }));
  const mx = Math.max(...data.map(d => d.v), 500);
  const W = 320, H = 140, padL = 36, padB = 26, padT = 24, padR = 16;
  const iW = W - padL - padR, iH = H - padB - padT;
  const bW = Math.floor(iW / data.length) - 12;
  const bars = data.map((d, i) => {
    const bH = Math.max(d.v > 0 ? 4 : 0, Math.round((d.v / mx) * iH));
    const x = padL + i * (iW / data.length) + (iW / data.length - bW) / 2;
    const y = padT + iH - bH;
    const valLabel = d.v > 0 ? `<text x="${x + bW / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="700" fill="${C.ink}">${d.v}</text>` : '';
    return `${valLabel}
<rect x="${x}" y="${y}" width="${bW}" height="${Math.max(0, bH)}" rx="6" fill="${d.color}"/>
<text x="${x + bW / 2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="${C.sub}">${d.label.slice(0, 5)}</text>`;
  }).join('');

  const goalLine = state.user.targets.cal;
  const goalY = padT + iH - Math.round((goalLine / mx) * iH);
  const goalLineEl = goalLine > 0 && goalLine <= mx
    ? `<line x1="${padL}" y1="${goalY}" x2="${W - padR}" y2="${goalY}" stroke="${C.action}" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="${W - padR}" y="${goalY - 4}" text-anchor="end" font-size="9" fill="${C.action}">Daily goal ${goalLine} kcal</text>`
    : '';

  const yLabels = [0, Math.round(mx / 2), mx].map(v => {
    const ly = padT + iH - Math.round((v / mx) * iH);
    return `<text x="${padL - 4}" y="${ly + 3}" text-anchor="end" font-size="9" fill="${C.sub}">${v}</text>`;
  }).join('');

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${yLabels}${goalLineEl}${bars}</svg>`;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────
export function renderHome(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const pct = Math.min(100, Math.round((sum.cal / t.cal) * 100));
  const rem = t.cal - sum.cal;
  const proLeft = Math.max(0, Math.round(t.pro - sum.pro));

  const heroTitle = isToday
    ? (rem > 0 ? "You're on track today" : 'Goal hit! 🎉')
    : `Viewing ${dFull(Math.round((new Date(state.selDate) - new Date(dKey(0))) / 86400000))}`;

  // Mascot SVG (simple flame-buddy inline)
  const mascot = `<svg width="56" height="64" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="28" cy="58" rx="14" ry="5" fill="rgba(0,0,0,.12)"/>
<path d="M28 4C28 4 14 18 14 32C14 42.5 20 50 28 50C36 50 42 42.5 42 32C42 18 28 4 28 4Z" fill="#FF9500"/>
<path d="M28 12C28 12 20 22 20 30C20 36 23.5 40 28 40C32.5 40 36 36 36 30C36 22 28 12 28 12Z" fill="#FFCC00"/>
<path d="M28 22C28 22 24 27 24 31C24 33.8 25.8 36 28 36C30.2 36 32 33.8 32 31C32 27 28 22 28 22Z" fill="white" opacity="0.6"/>
<circle cx="22" cy="30" r="3.5" fill="white"/>
<circle cx="34" cy="30" r="3.5" fill="white"/>
<circle cx="22" cy="31" r="1.5" fill="${C.ink}"/>
<circle cx="34" cy="31" r="1.5" fill="${C.ink}"/>
<path d="M24 38C24 38 26 40 28 40C30 40 32 38 32 38" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

  const mealRows = state.cats.map(c => mealRow(state, c, isToday)).join('');

  const tipText = proLeft > 0
    ? `${proLeft}g of protein to go — a shake or yoghurt closes the gap.`
    : 'Protein goal reached — great balanced day! 🎉';

  return `
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

<!-- HERO CARD -->
<div style="width:100%;border-radius:26px;padding:22px;margin-bottom:14px;background:${C.brand};box-shadow:0 8px 28px rgba(239,115,5,.25)" class="soft-lg">
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
  <div style="flex:1">
    <div style="font-size:42px;font-weight:900;color:#fff;line-height:1">${sum.cal}</div>
    <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.85);margin-top:2px">kcal logged</div>
    ${hBar(pct, '#fff', 'rgba(255,255,255,.28)', 10)}
    <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">
      <span>${sum.cal} / ${t.cal} kcal</span>
      <span style="font-weight:700;color:#fff">${pct}% complete</span>
    </div>
  </div>
  <div style="flex-shrink:0;margin-top:-4px">${mascot}</div>
</div>

<div style="display:flex;gap:8px;margin-top:16px">
  ${macroPill('🍗','Protein', Math.round(sum.pro), t.pro, '#fff', 'rgba(255,255,255,.18)')}
  ${macroPill('🍞','Carbs', Math.round(sum.carb), t.carb, '#fff', 'rgba(255,255,255,.18)')}
  ${macroPill('🥑','Fats', Math.round(sum.fat), t.fat, '#fff', 'rgba(255,255,255,.18)')}
</div>
</div>

<!-- TODAY'S TIP -->
<div style="display:flex;align-items:center;gap:14px;border-radius:20px;padding:16px 18px;margin-bottom:12px;background:${C.brandSoft}">
<div style="width:40px;height:40px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('bulb',C.brand,20)}</div>
<div style="flex:1">
  <div style="font-size:13px;font-weight:800;color:${C.ink};margin-bottom:2px">Today's tip</div>
  <div style="font-size:13px;color:${C.sub};line-height:1.4">${tipText}</div>
</div>
${ic('chevR',C.sub,16)}
</div>

<!-- PREMIUM BANNER -->
<div style="display:flex;align-items:center;justify-content:space-between;border-radius:20px;padding:14px 16px;margin-bottom:20px;background:${C.card};border:1px solid ${C.border}">
<div style="display:flex;align-items:center;gap:12px">
  <div style="font-size:26px">👑</div>
  <div>
    <div style="font-size:13px;font-weight:800;color:${C.brand}">Go Premium.</div>
    <div style="font-size:12px;color:${C.sub};margin-top:1px">Unlock deeper insights and smarter nutrition tracking.</div>
  </div>
</div>
<button style="flex-shrink:0;padding:9px 14px;border-radius:22px;background:${C.brand};color:#fff;font-size:12px;font-weight:700;white-space:nowrap">Try 7 days free ${ic('chevR','#fff',11)}</button>
</div>

<!-- DAILY MEALS -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:${C.sub}">DAILY MEALS</div>
<button onclick="app.sheet('addcat')" style="width:30px;height:30px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus','#fff',15)}</button>
</div>
<div style="background:${C.white};border-radius:20px;padding:0 16px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
${mealRows}
<div style="height:4px"></div>
</div>

<!-- CALORIES BY MEAL CHART -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:${C.sub}">NUTRITION CONTRIBUTION</div>
<div style="font-size:11px;color:${C.sub}">vs your daily goal</div>
</div>
<div style="background:${C.white};border-radius:20px;padding:16px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
${mealBarChart(state, state.cats, isToday)}
<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:4px">
  <div style="font-size:12px;color:${C.sub}">Daily goal</div>
  <div style="font-size:14px;font-weight:800;color:${C.ink}">${t.cal} kcal</div>
</div>
</div>`;
}
