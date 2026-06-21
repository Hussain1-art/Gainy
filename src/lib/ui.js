import { C } from './constants.js';
import { ic } from './icons.js';
import { dKey, dDay, dDate, goalHit } from './helpers.js';

// ─── DONUT RING ───────────────────────────────────────────────────────────
export function donutRing(rings, size = 110, label = '', sub = '') {
  const c = size / 2;
  const arcs = rings.map((r, i) => {
    const rad = c - 7 - i * 9;
    const circ = 2 * Math.PI * rad;
    const pct = Math.min(1, Math.max(0, r.v / r.max));
    return `<circle cx="${c}" cy="${c}" r="${rad}" fill="none" stroke="${r.bg}" stroke-width="7"/>
<circle cx="${c}" cy="${c}" r="${rad}" fill="none" stroke="${r.color}" stroke-width="7" stroke-dasharray="${circ * pct} ${circ}" stroke-linecap="round"/>`;
  }).join('');
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
<svg width="${size}" height="${size}" style="transform:rotate(-90deg)">${arcs}</svg>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
<div style="font-size:${Math.round(size * 0.17)}px;font-weight:700;color:${C.ink}">${label}</div>
${sub ? `<div style="font-size:10px;color:${C.sub};margin-top:2px;text-align:center;max-width:${size - 20}px">${sub}</div>` : ''}
</div></div>`;
}

// ─── STEPPER ──────────────────────────────────────────────────────────────
export function stepper(id, val, decAction, incAction, suffix = '') {
  return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
<button onclick="${decAction}" style="width:36px;height:36px;border-radius:50%;background:${C.blueSoft};color:${C.blue};font-size:20px;font-weight:700">−</button>
<div id="${id}" style="font-size:16px;font-weight:600;min-width:64px;text-align:center;color:${C.ink}">${val}${suffix}</div>
<button onclick="${incAction}" style="width:36px;height:36px;border-radius:50%;background:${C.blueSoft};color:${C.blue};font-size:20px;font-weight:700">+</button>
</div>`;
}

// ─── WEEK CALENDAR ────────────────────────────────────────────────────────
export function weekCalendarHTML({ wOff, selDate, cache, targets }) {
  const today = dKey(0);
  const days = [];
  for (let i = -3; i <= 3; i++) days.push(wOff * 7 + i);

  const btns = days.map(off => {
    const key = dKey(off);
    const isTod = key === today;
    const isFut = off > 0;
    const isSel = key === selDate;
    const sum = cache[key];
    const hit = sum ? goalHit(sum, targets) : false;
    let bg = C.border, fg = C.sub, brd = '2px solid transparent';
    if (!isFut && sum && sum.cal > 0) { bg = hit ? C.blue : C.ice; fg = hit ? '#fff' : C.blueDark; }
    if (isTod) { brd = `2px solid ${C.blue}`; if (!sum || sum.cal === 0) { bg = '#fff'; fg = C.blue; } }
    if (isSel && !isTod) brd = `2px solid ${C.blueDark}`;
    return `<button onclick="app.selDate('${key}')" style="display:flex;flex-direction:column;align-items:center;gap:6px">
<div style="font-size:10px;font-weight:500;color:${isSel ? C.blueDark : C.sub}">${dDay(off)}</div>
<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${bg};color:${fg};border:${brd}">${dDate(off)}</div>
</button>`;
  }).join('');

  return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
<button onclick="app.wOff(-1)" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:${C.sub}">${ic('chevL')}</button>
<div style="flex:1;display:flex;justify-content:space-between">${btns}</div>
<button onclick="app.wOff(1)" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:${C.sub}">${ic('chevR')}</button>
</div>`;
}

// ─── BAR CHART (pure SVG) ─────────────────────────────────────────────────
export function barChart(data, onClickFn) {
  const W = 320, H = 130, pad = { t: 10, r: 4, b: 24, l: 28 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const mx = Math.max(...data.map(d => d.v), 1);
  const bW = Math.floor(iW / data.length) - 6;
  const bars = data.map((d, i) => {
    const bH = Math.round((d.v / mx) * iH);
    const x = pad.l + i * (iW / data.length) + (iW / data.length - bW) / 2;
    const y = pad.t + iH - bH;
    const label = d.label.slice(0, 4);
    return `<rect x="${x}" y="${y}" width="${bW}" height="${bH}" rx="4" fill="${d.color}" style="cursor:pointer" onclick="${onClickFn}(${i})"/>
<text x="${x + bW / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="${C.sub}">${label}</text>`;
  }).join('');
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${bars}</svg>`;
}

// ─── SHARED LABELS ────────────────────────────────────────────────────────
export function sectionLabel(text, marginTop = 0) {
  return `<div class="lbl" style="margin-top:${marginTop}px">${text}</div>`;
}

export function sheetHd(title) {
  return `<div style="font-size:18px;font-weight:700;color:${C.ink};margin-bottom:16px">${title}</div>`;
}
