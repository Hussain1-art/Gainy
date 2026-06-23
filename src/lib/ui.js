import { C } from './constants.js';
import { ic } from './icons.js';
import { dKey, dDay, dDate, goalHit } from './helpers.js';

// ─── DONUT RING ───────────────────────────────────────────────────────────
export function donutRing(rings, size = 110, label = '', sub = '') {
  const c = size / 2;
  const arcs = rings.map((r, i) => {
    const rad = c - 8 - i * 10;
    const circ = 2 * Math.PI * rad;
    const pct = Math.min(1, Math.max(0, r.v / r.max));
    return `<circle cx="${c}" cy="${c}" r="${rad}" fill="none" stroke="${r.bg}" stroke-width="8"/>
<circle cx="${c}" cy="${c}" r="${rad}" fill="none" stroke="${r.color}" stroke-width="8" stroke-dasharray="${circ * pct} ${circ}" stroke-linecap="round"/>`;
  }).join('');
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
<svg width="${size}" height="${size}" style="transform:rotate(-90deg)">${arcs}</svg>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
<div style="font-size:${Math.round(size * 0.19)}px;font-weight:800;color:${C.ink}">${label}</div>
${sub ? `<div style="font-size:10px;color:${C.sub};margin-top:2px;text-align:center;max-width:${size - 20}px">${sub}</div>` : ''}
</div></div>`;
}

// ─── STEPPER ──────────────────────────────────────────────────────────────
export function stepper(id, val, decAction, incAction, suffix = '') {
  const b = `width:40px;height:40px;border-radius:50%;background:${C.brandSoft};color:${C.brand};font-size:22px;font-weight:700`;
  return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:4px">
<button onclick="${decAction}" style="${b}">−</button>
<div id="${id}" style="font-size:17px;font-weight:700;min-width:72px;text-align:center;color:${C.ink}">${val}${suffix}</div>
<button onclick="${incAction}" style="${b}">+</button>
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
    const logged = !isFut && sum && sum.cal > 0;
    const hit = logged ? goalHit(sum, targets) : false;

    let bg = C.cardSoft, fg = C.sub, ring = '2px solid transparent';
    if (logged) { bg = hit ? C.action : C.warm; fg = hit ? '#fff' : C.ink; }
    if (isTod) ring = `2px solid ${C.brand}`;
    if (isSel && !isTod) ring = `2px solid ${C.actionDark}`;

    return `<button onclick="app.selDate('${key}')" style="display:flex;flex-direction:column;align-items:center;gap:6px">
<div style="font-size:10px;font-weight:600;color:${isSel ? C.actionDark : C.sub}">${dDay(off)}</div>
<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;background:${bg};color:${fg};border:${ring}">${hit ? ic('check', '#fff', 14) : dDate(off)}</div>
</button>`;
  }).join('');

  return `<div style="display:flex;align-items:center;gap:2px;margin-bottom:18px">
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
  const bW = Math.floor(iW / data.length) - 8;
  const bars = data.map((d, i) => {
    const bH = Math.round((d.v / mx) * iH);
    const x = pad.l + i * (iW / data.length) + (iW / data.length - bW) / 2;
    const y = pad.t + iH - bH;
    const label = d.label.slice(0, 4);
    return `<rect x="${x}" y="${y}" width="${bW}" height="${Math.max(2, bH)}" rx="5" fill="${d.color}" style="cursor:pointer" onclick="${onClickFn}(${i})"/>
<text x="${x + bW / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="${C.sub}">${label}</text>`;
  }).join('');
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${bars}</svg>`;
}

// ─── LINE CHART (weight trend) ────────────────────────────────────────────
export function lineChart(points, { target, color = C.brand } = {}) {
  const W = 320, H = 130, pad = { t: 14, r: 14, b: 20, l: 30 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  if (!points || points.length === 0) return '';
  const kgs = points.map(p => p.kg);
  const vals = target != null ? [...kgs, target] : kgs;
  let mn = Math.min(...vals), mx = Math.max(...vals);
  if (mx - mn < 2) { const mid = (mx + mn) / 2; mn = mid - 1.5; mx = mid + 1.5; }
  const x = (i) => pad.l + (points.length === 1 ? iW / 2 : (i / (points.length - 1)) * iW);
  const y = (v) => pad.t + iH - ((v - mn) / (mx - mn)) * iH;
  const pts = points.map((p, i) => `${x(i)},${y(p.kg)}`).join(' ');
  const area = points.length > 1
    ? `<polygon points="${pad.l},${pad.t + iH} ${pts} ${pad.l + iW},${pad.t + iH}" fill="${color}" opacity="0.10"/>` : '';
  const line = points.length > 1
    ? `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`).join('');
  const goal = target != null
    ? `<line x1="${pad.l}" y1="${y(target)}" x2="${W - pad.r}" y2="${y(target)}" stroke="${C.action}" stroke-width="1.5" stroke-dasharray="4 4"/>
<text x="${W - pad.r}" y="${y(target) - 5}" text-anchor="end" font-size="9" fill="${C.action}">target ${target}kg</text>` : '';
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${goal}${area}${line}${dots}</svg>`;
}

// ─── SHARED LABELS ────────────────────────────────────────────────────────
export function sectionLabel(text, marginTop = 0) {
  return `<div class="lbl" style="margin-top:${marginTop}px">${text}</div>`;
}

export function sheetHd(title) {
  return `<div style="font-size:20px;font-weight:800;color:${C.ink};margin-bottom:18px">${title}</div>`;
}
