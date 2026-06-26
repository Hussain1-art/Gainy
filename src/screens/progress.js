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

// ─── DAILY CALORIES CHART (7 bars) ───────────────────────────────────────
function dailyCalChart(state, days) {
  const t = state.user.targets;
  const today = dKey(0);
  const data = days.map(off => {
    const key = dKey(off);
    const isT = key === today;
    const sum = isT ? sumLog(state.log) : (state.cache[key] || null);
    const cal = sum ? sum.cal : null;
    const dayStr = ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(key + 'T12:00:00').getDay()];
    const hit = cal != null && cal >= t.cal * 0.9 && cal <= t.cal * 1.1;
    return { cal, dayStr, hit, isT };
  });

  const mx = Math.max(t.cal * 1.2, ...data.map(d => d.cal || 0), 500);
  const W = 320, H = 120, padL = 8, padB = 22, padT = 12, padR = 8;
  const iW = W - padL - padR, iH = H - padB - padT;
  const bW = Math.floor(iW / data.length) - 8;
  const goalY = padT + iH - Math.round((t.cal / mx) * iH);

  const bars = data.map((d, i) => {
    if (d.cal === null) {
      const x = padL + i * (iW / data.length) + (iW / data.length - bW) / 2;
      return `<rect x="${x}" y="${padT + iH - 4}" width="${bW}" height="4" rx="3" fill="${C.border}"/>
<text x="${x + bW/2}" y="${H - 5}" text-anchor="middle" font-size="9" fill="${C.sub}">${d.dayStr}</text>`;
    }
    const bH = Math.max(4, Math.round((d.cal / mx) * iH));
    const x = padL + i * (iW / data.length) + (iW / data.length - bW) / 2;
    const y = padT + iH - bH;
    const color = d.isT ? C.brand : d.hit ? C.action : C.warm;
    return `<rect x="${x}" y="${y}" width="${bW}" height="${bH}" rx="5" fill="${color}" ${d.isT ? `opacity="1"` : 'opacity=".85"'}/>
<text x="${x + bW/2}" y="${H - 5}" text-anchor="middle" font-size="9" fill="${d.isT ? C.ink : C.sub}">${d.dayStr}</text>`;
  }).join('');

  const goalLine = `<line x1="${padL}" y1="${goalY}" x2="${W - padR}" y2="${goalY}" stroke="${C.action}" stroke-width="1.5" stroke-dasharray="5 3"/>
<text x="${W - padR}" y="${goalY - 4}" text-anchor="end" font-size="9" fill="${C.action}">Goal ${t.cal}</text>`;

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${goalLine}${bars}</svg>`;
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

// ─── TIMEFRAME PILLS ─────────────────────────────────────────────────────
function tfPills(active, options, onClickFn) {
  return `<div style="display:flex;gap:6px">
${options.map(o => `<button onclick="${onClickFn}('${o}')" style="padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${active===o ? C.brand : C.card};color:${active===o ? '#fff' : C.sub}">${o}</button>`).join('')}
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
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });

  // Build last 7 days offsets
  const last7 = [-6,-5,-4,-3,-2,-1,0];

  // Nutrition consistency — count days this week hitting targets
  const calHitDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) { const s = sumLog(state.log); return s.cal >= t.cal * 0.9; }
    const s = state.cache[key];
    return s && s.cal >= t.cal * 0.9;
  }).length;

  const proHitDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) { const s = sumLog(state.log); return s.pro >= t.pro * 0.9; }
    const s = state.cache[key];
    return s && s.pro >= t.pro * 0.9;
  }).length;

  const loggedDays = last7.filter(off => {
    const key = dKey(off);
    if (key === today) return sumLog(state.log).cal > 0;
    const s = state.cache[key];
    return s && s.cal > 0;
  }).length;

  // Weight progress
  const weightStart = Array.isArray(u.weightLog) && u.weightLog.length > 0
    ? u.weightLog[0].kg
    : u.weight;
  const weightCurrent = wc.current;
  const weightGoal = wc.target;
  const isGain = u.goal === 'gain';
  const totalRange = Math.abs(weightGoal - weightStart);
  const progress = totalRange > 0
    ? Math.min(100, Math.round((Math.abs(weightCurrent - weightStart) / totalRange) * 100))
    : 100;
  const toGoal = Math.round(Math.abs(weightGoal - weightCurrent) * 10) / 10;

  // Weight log for trend
  const wPoints = (Array.isArray(u.weightLog) && u.weightLog.length
    ? u.weightLog
    : [{ d: today, kg: u.weight }]).slice(-20);

  const tfMap = { '30D': -30, '90D': -90, '6M': -180, '1Y': -365 };
  const activeTf = state.progressTf || '90D';

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
    ${['7D','30D'].map(o => `<button onclick="app.progressTf && app.progressTf('${o}')" style="padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${activeTf===o||(!state.progressTf&&o==='7D') ? C.brand : C.card};color:${activeTf===o||(!state.progressTf&&o==='7D') ? '#fff' : C.sub}">${o}</button>`).join('')}
  </div>
</div>
${dailyCalChart(state, last7)}
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid ${C.border}">
  <div style="font-size:13px;color:${C.sub}">
    <span style="font-weight:700;color:${C.ink}">${calHitDays} of 7 days</span> hit your calorie target
  </div>
  <div style="font-size:13px;font-weight:800;color:${C.brand}">${avg.avgCal || '—'} avg</div>
</div>
</div>

<!-- NUTRITION CONSISTENCY CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="font-size:16px;font-weight:800;color:${C.ink};margin-bottom:4px">Nutrition Consistency</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:10px">Last 7 days</div>
${metricRow('Days calorie target hit', `${calHitDays}/7`, calHitDays >= 5 ? 'Great consistency!' : 'Keep going', calHitDays >= 5 ? C.action : C.brand)}
${metricRow('Days protein target hit', `${proHitDays}/7`, proHitDays >= 5 ? 'Great protein consistency!' : `${avg.avgPro || '—'}g avg`, proHitDays >= 5 ? C.action : C.ink)}
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
  <button onclick="app.sheet('updateweight')" style="display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:22px;background:${C.action};color:#fff;font-size:12px;font-weight:700">${ic('scale','#fff',14)} Log weight</button>
</div>
<div style="display:flex;justify-content:space-between;font-size:12px;color:${C.sub};margin:12px 0 4px">
  <span>Start: <strong style="color:${C.ink}">${weightStart} kg</strong></span>
  <span>Goal: <strong style="color:${C.ink}">${weightGoal} kg</strong></span>
</div>
${hBar(progress, C.brand, C.card, 10)}
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
  <div style="font-size:13px;color:${C.sub}">${toGoal > 0 ? `${toGoal} kg to goal` : 'Goal reached! 🎉'}</div>
  <div style="font-size:12px;font-weight:700;color:${C.action}">${progress}% there</div>
</div>
${toGoal > 0 ? `<div style="margin-top:10px;padding:10px 14px;border-radius:14px;background:${C.brandSoft};font-size:12px;color:${C.sub}"><span style="font-weight:700;color:${C.brand}">On track</span> based on your recent trend</div>` : ''}
</div>

<!-- WEIGHT TREND CARD -->
<div style="background:${C.white};border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
  <div style="font-size:16px;font-weight:800;color:${C.ink}">Weight Trend</div>
  <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
    ${['30D','90D','6M','1Y','ALL'].map(o => `<button style="padding:4px 10px;border-radius:18px;font-size:10px;font-weight:700;background:${activeTf===o ? C.brand : C.card};color:${activeTf===o ? '#fff' : C.sub}">${o}</button>`).join('')}
  </div>
</div>
${wPoints.length > 1
  ? lineChart(wPoints, { target: weightGoal })
  : `<div style="padding:28px 12px;text-align:center;font-size:12px;color:${C.sub};background:${C.card};border-radius:16px">Log your weight a few times to see your trend.</div>`}
<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid ${C.border}">
  <div style="flex:1;text-align:center">
    <div style="font-size:11px;color:${C.sub}">Since start</div>
    <div style="font-size:15px;font-weight:800;color:${wc.sinceStart < 0 ? C.action : C.ink};margin-top:3px">${wc.sinceStart > 0 ? '+' : ''}${wc.sinceStart} kg</div>
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
