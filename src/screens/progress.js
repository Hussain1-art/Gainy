import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { lineChart } from '../lib/ui.js';
import { sumLog, dKey, esc, weightChanges, weeklyAverages } from '../lib/helpers.js';

// ─── HORIZONTAL BAR ───────────────────────────────────────────────────────
function hBar(pct, fg = C.brand, bg = C.card, h = 8) {
  const w = Math.min(100, Math.max(0, pct));
  return `<div style="width:100%;height:${h}px;border-radius:${h}px;background:${bg};overflow:hidden;margin:6px 0">
<div style="height:100%;width:${w}%;background:${fg};border-radius:${h}px;transition:width .4s ease"></div>
</div>`;
}

// ─── MEAL CONTRIBUTION BAR CHART (for a specific date) ───────────────────
function mealContribChart(state, cats, dateKey) {
  const today = dKey(0);
  const isToday = dateKey === today;
  const meals = isToday ? state.log.meals : {};

  const data = cats.map((c, idx) => {
    const v = isToday ? (meals[c.id] || []).reduce((s, i) => s + i.cal, 0) : 0;
    const colors = [C.gold, C.warm, C.brand, C.brandSoft];
    const labelColors = [C.ink, C.ink, '#fff', C.ink];
    return { label: c.label, icon: c.icon, v, color: colors[idx % 4], labelColor: labelColors[idx % 4] };
  });

  const total = data.reduce((s, d) => s + d.v, 0);
  const mx = Math.max(...data.map(d => d.v), 500);
  const W = 300, H = 130, padL = 8, padB = 26, padT = 20, padR = 16;
  const iW = W - padL - padR, iH = H - padB - padT;
  const bW = Math.floor(iW / data.length) - 10;

  const bars = data.map((d, i) => {
    const bH = Math.max(d.v > 0 ? 6 : 2, Math.round((d.v / mx) * iH));
    const x = padL + i * (iW / data.length) + (iW / data.length - bW) / 2;
    const y = padT + iH - bH;
    const valLabel = d.v > 0
      ? `<text x="${x + bW/2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="700" fill="${C.ink}">${d.v}</text>`
      : '';
    return `${valLabel}
<rect x="${x}" y="${y}" width="${bW}" height="${Math.max(2, bH)}" rx="6" fill="${d.color}"/>
<text x="${x + bW/2}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${C.sub}">${d.label.slice(0,5)}</text>`;
  }).join('');

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${bars}</svg>
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding-top:8px;border-top:1px solid ${C.border}">
  <div style="font-size:12px;color:${C.sub}">Total logged today</div>
  <div style="font-size:14px;font-weight:800;color:${C.brand}">${total} kcal</div>
</div>`;
}

// ─── DAILY CALORIES HISTORY CHART (multi-day with date selector) ──────────
function dailyCalHistoryChart(state, offsets) {
  const t = state.user.targets;
  const today = dKey(0);

  const data = offsets.map(off => {
    const key = dKey(off);
    const isT = key === today;
    const sum = isT ? sumLog(state.log) : (state.cache[key] || null);
    const cal = sum ? sum.cal : null;
    const d = new Date(key + 'T12:00:00');
    const dayStr = ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
    const dateNum = d.getDate();
    const hit = cal != null && cal >= t.cal * 0.88;
    return { cal, dayStr, dateNum, hit, isT };
  });

  const mx = Math.max(t.cal * 1.25, ...data.map(d => d.cal || 0), 500);
  const W = 320, H = 140, padL = 34, padB = 32, padT = 12, padR = 12;
  const iW = W - padL - padR, iH = H - padB - padT;
  const bW = Math.max(12, Math.floor(iW / data.length) - 6);
  const goalY = padT + iH - Math.round((t.cal / mx) * iH);

  const bars = data.map((d, i) => {
    const x = padL + i * (iW / data.length) + (iW / data.length - bW) / 2;
    if (d.cal === null) {
      return `<rect x="${x}" y="${padT + iH - 3}" width="${bW}" height="3" rx="2" fill="${C.border}"/>
<text x="${x + bW/2}" y="${H - 18}" text-anchor="middle" font-size="8" fill="${C.sub}">${d.dayStr}</text>
<text x="${x + bW/2}" y="${H - 8}" text-anchor="middle" font-size="8" fill="${C.border}">${d.dateNum}</text>`;
    }
    const bH = Math.max(4, Math.round((d.cal / mx) * iH));
    const y = padT + iH - bH;
    const color = d.isT ? C.brand : d.hit ? C.action : C.warm;
    const ring = d.isT ? `stroke="${C.actionDark}" stroke-width="1.5"` : '';
    return `<rect x="${x}" y="${y}" width="${bW}" height="${bH}" rx="5" fill="${color}" ${ring}/>
<text x="${x + bW/2}" y="${H - 18}" text-anchor="middle" font-size="8" fill="${d.isT ? C.ink : C.sub}">${d.dayStr}</text>
<text x="${x + bW/2}" y="${H - 8}" text-anchor="middle" font-size="8" fill="${d.isT ? C.brand : C.sub}">${d.dateNum}</text>`;
  }).join('');

  // y-axis labels
  const yLabels = [0, Math.round(mx/2), mx].map(v => {
    const ly = padT + iH - Math.round((v/mx)*iH);
    return `<text x="${padL - 4}" y="${ly + 3}" text-anchor="end" font-size="8" fill="${C.sub}">${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}</text>`;
  }).join('');

  const goalLine = `<line x1="${padL}" y1="${goalY}" x2="${W - padR}" y2="${goalY}" stroke="${C.brand}" stroke-width="1.5" stroke-dasharray="5 3" opacity=".6"/>
<text x="${W - padR}" y="${goalY - 4}" text-anchor="end" font-size="8" fill="${C.brand}">Goal</text>`;

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${yLabels}${goalLine}${bars}</svg>`;
}

// ─── CONSISTENCY METRIC ROW ───────────────────────────────────────────────
function metricRow(label, val, sub, color = C.ink) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${C.border}">
<div style="font-size:14px;color:${C.sub}">${label}</div>
<div style="text-align:right">
  <div style="font-size:16px;font-weight:800;color:${color}">${val}</div>
  ${sub ? `<div style="font-size:11px;color:${C.sub};margin-top:1px">${sub}</div>` : ''}
</div>
</div>`;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────
export function renderProgress(state) {
  const u = state.user;
  const t = u.targets;
  const wc = weightChanges(u);
  const avg = weeklyAverages(state.cache);
  const streak = state.streak || 0;
  const today = dKey(0);
  const isToday = state.selDate === today;

  // Timeframe for daily cal history
  const activeTf = state.progressTf || '7D';
  const tfOffsets = {
    '7D': [-6,-5,-4,-3,-2,-1,0],
    '14D': Array.from({length:14}, (_,i) => i-13),
    '30D': Array.from({length:30}, (_,i) => i-29),
  };
  const offsets = tfOffsets[activeTf] || tfOffsets['7D'];

  // Nutrition consistency (last 7 days)
  const last7 = [-6,-5,-4,-3,-2,-1,0];
  const calHitDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) return sumLog(state.log).cal >= t.cal * 0.88;
    const s = state.cache[key]; return s && s.cal >= t.cal * 0.88;
  }).length;
  const proHitDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) return sumLog(state.log).pro >= t.pro * 0.88;
    const s = state.cache[key]; return s && s.pro >= t.pro * 0.88;
  }).length;
  const loggedDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) return sumLog(state.log).cal > 0;
    const s = state.cache[key]; return s && s.cal > 0;
  }).length;

  // Weight progress
  const weightStart = Array.isArray(u.weightLog) && u.weightLog.length > 0 ? u.weightLog[0].kg : u.weight;
  const weightCurrent = wc.current;
  const weightGoal = wc.target;
  const totalRange = Math.abs(weightGoal - weightStart);
  const progress = totalRange > 0 ? Math.min(100, Math.round((Math.abs(weightCurrent - weightStart) / totalRange) * 100)) : 100;
  const toGoal = Math.round(Math.abs(weightGoal - weightCurrent) * 10) / 10;

  const wPoints = (Array.isArray(u.weightLog) && u.weightLog.length
    ? u.weightLog : [{ d: today, kg: u.weight }]).slice(-20);

  return `
<!-- HEADER -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">
<div>
  <div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:${C.brand};margin-bottom:2px">GAINY</div>
  <div style="font-size:28px;font-weight:800;color:${C.ink}">Progress</div>
</div>
<button onclick="app.sheet('scanner')" style="width:46px;height:46px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center" class="soft">${ic('cam','#fff')}</button>
</div>

<!-- DAILY CALORIES CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
  <div style="font-size:16px;font-weight:800;color:${C.ink}">Daily Calories</div>
  <div style="display:flex;gap:6px">
    ${['7D','14D','30D'].map(o => `<button onclick="state.progressTf='${o}';render()" style="padding:5px 10px;border-radius:18px;font-size:10px;font-weight:700;background:${activeTf===o ? C.brand : C.card};color:${activeTf===o ? '#fff' : C.sub}">${o}</button>`).join('')}
  </div>
</div>
${dailyCalHistoryChart(state, offsets)}
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid ${C.border}">
  <div style="font-size:13px;color:${C.sub}"><span style="font-weight:700;color:${C.ink}">${calHitDays} of 7 days</span> hit your calorie target</div>
  <div style="font-size:13px;font-weight:800;color:${C.brand}">${avg.avgCal || '—'} avg</div>
</div>
</div>

<!-- CALORIE CONTRIBUTION BY MEAL -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
  <div style="font-size:16px;font-weight:800;color:${C.ink}">Calories by Meal</div>
  <div style="font-size:11px;color:${C.sub}">today</div>
</div>
${mealContribChart(state, state.cats, today)}
</div>

<!-- NUTRITION CONSISTENCY CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="font-size:16px;font-weight:800;color:${C.ink};margin-bottom:4px">Nutrition Consistency</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:10px">Last 7 days</div>
${metricRow('Days calorie target hit', `${calHitDays}/7`, calHitDays >= 5 ? 'Great work!' : 'Keep going', calHitDays >= 5 ? C.brand : C.ink)}
${metricRow('Days protein target hit', `${proHitDays}/7`, proHitDays >= 5 ? 'Solid consistency!' : `${avg.avgPro || '—'}g avg`, proHitDays >= 5 ? C.brand : C.ink)}
${metricRow('Meals logged this week', `${loggedDays} days`, 'out of 7', C.ink)}
<div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px">
  <div style="font-size:14px;color:${C.sub}">Current logging streak</div>
  <div style="display:flex;align-items:center;gap:6px">
    ${ic('flame', streak > 0 ? C.brand : C.sub, 16)}
    <span style="font-size:16px;font-weight:800;color:${streak > 0 ? C.brand : C.sub}">${streak} day${streak !== 1 ? 's' : ''}</span>
  </div>
</div>
</div>

<!-- WEIGHT PROGRESS CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="font-size:16px;font-weight:800;color:${C.ink};margin-bottom:14px">Weight Progress</div>
<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4px">
  <div>
    <div style="font-size:36px;font-weight:900;color:${C.ink};line-height:1">${weightCurrent}<span style="font-size:16px;font-weight:600;color:${C.sub}"> kg</span></div>
    <div style="font-size:12px;color:${C.sub};margin-top:2px">Current weight</div>
  </div>
  <button onclick="app.sheet('updateweight')" style="display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:22px;background:${C.brand};color:#fff;font-size:12px;font-weight:700">${ic('scale','#fff',14)} Log weight</button>
</div>
<div style="display:flex;justify-content:space-between;font-size:12px;color:${C.sub};margin:12px 0 4px">
  <span>Start: <strong style="color:${C.ink}">${weightStart} kg</strong></span>
  <span>Goal: <strong style="color:${C.ink}">${weightGoal} kg</strong></span>
</div>
${hBar(progress, C.brand, C.card, 10)}
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
  <div style="font-size:13px;color:${C.sub}">${toGoal > 0 ? `${toGoal} kg to goal` : 'Goal reached! 🎉'}</div>
  <div style="font-size:12px;font-weight:700;color:${C.brand}">${progress}% there</div>
</div>
${toGoal > 0 ? `<div style="margin-top:10px;padding:10px 14px;border-radius:14px;background:${C.brandSoft};font-size:12px;color:${C.sub}"><span style="font-weight:700;color:${C.brand}">On track</span> based on your recent trend</div>` : ''}
</div>

<!-- WEIGHT TREND CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
  <div style="font-size:16px;font-weight:800;color:${C.ink}">Weight Trend</div>
  <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
    ${['30D','90D','6M','1Y','ALL'].map(o => `<button style="padding:4px 10px;border-radius:18px;font-size:10px;font-weight:700;background:${C.card};color:${C.sub}">${o}</button>`).join('')}
  </div>
</div>
${wPoints.length > 1
  ? lineChart(wPoints, { target: weightGoal, color: C.brand })
  : `<div style="padding:28px 12px;text-align:center;font-size:12px;color:${C.sub};background:${C.card};border-radius:16px">Log your weight a few times to see your trend.</div>`}
<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid ${C.border}">
  <div style="flex:1;text-align:center">
    <div style="font-size:11px;color:${C.sub}">Since start</div>
    <div style="font-size:15px;font-weight:800;color:${wc.sinceStart < 0 ? C.brand : C.ink};margin-top:3px">${wc.sinceStart > 0 ? '+' : ''}${wc.sinceStart} kg</div>
  </div>
  <div style="width:1px;background:${C.border}"></div>
  <div style="flex:1;text-align:center">
    <div style="font-size:11px;color:${C.sub}">Last change</div>
    <div style="font-size:15px;font-weight:800;color:${C.ink};margin-top:3px">${wc.sinceLast > 0 ? '+' : ''}${wc.sinceLast} kg</div>
  </div>
  <div style="width:1px;background:${C.border}"></div>
  <div style="flex:1;text-align:center">
    <div style="font-size:11px;color:${C.sub}">To target</div>
    <div style="font-size:15px;font-weight:800;color:${C.brand};margin-top:3px">${wc.toTarget > 0 ? '+' : ''}${wc.toTarget} kg</div>
  </div>
</div>
</div>

<button onclick="app.sheet('adjustgoal')" style="width:100%;padding:15px;border-radius:18px;font-size:14px;font-weight:700;background:${C.card};color:${C.ink};margin-bottom:8px">Adjust daily goals</button>`;
}
