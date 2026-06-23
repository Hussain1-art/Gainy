import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing, weekCalendarHTML } from '../lib/ui.js';
import { sumLog, dKey, dFull, esc } from '../lib/helpers.js';

export function renderHome(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const rem = t.cal - sum.cal;
  const pct = Math.round((sum.cal / t.cal) * 100);
  const proLeft = Math.max(0, Math.round(t.pro - sum.pro));
  const items = Object.values(state.log.meals).reduce((s, m) => s + m.length, 0);
  const loggedCats = state.cats.filter(c => (state.log.meals[c.id] || []).length > 0).map(c => esc(c.label)).join(', ');

  // Tinted icon chip per routine type.
  const chipBg = { water: C.sage, meal: C.warm, custom: C.brandSoft };
  const routineRows = state.routine.map(r => {
    let done = false, label = r.label;
    if (r.type === 'water') { done = state.log.water >= t.water; label = `Drink water (${state.log.water}/${t.water})`; }
    else if (r.type === 'meal') { const cat = state.cats.find(c => c.id === r.mid); done = cat && (state.log.meals[cat.id] || []).length > 0; label = cat ? cat.label : r.label; }
    else { done = !!state.log.done[r.id]; }
    return `<button onclick="app.toggleRoutine('${r.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;border-radius:18px;padding:13px 14px;margin-bottom:9px;text-align:left;background:${C.card}">
<div style="display:flex;align-items:center;gap:12px;font-size:14px;font-weight:700;color:${C.ink}">
<span style="width:38px;height:38px;border-radius:12px;background:${chipBg[r.type] || C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:18px">${r.icon}</span>${esc(label)}</div>
<div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${done ? C.action : C.cardSoft}">${done ? ic('check', '#fff', 14) : ''}</div>
</button>`;
  }).join('');

  const quick = (icon, color, val, lbl) => `<button onclick="app.tab('progress')" class="card-white" style="flex:1;padding:13px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px">
<div style="color:${color}">${ic(icon, color, 18)}</div>
<div style="font-size:15px;font-weight:800;color:${C.ink}">${val}</div>
<div style="font-size:9px;font-weight:600;color:${C.sub}">${lbl}</div></button>`;

  return `
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
<div><div style="font-size:13px;color:${C.sub}">Welcome back,</div><div style="font-size:26px;font-weight:800;color:${C.ink}">${esc(state.user.name)}</div></div>
<div style="display:flex;gap:8px">
<button onclick="app.sheet('quickadd')" style="width:46px;height:46px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center" class="soft">${ic('plus', '#fff', 20)}</button>
<button onclick="app.sheet('reminders')" style="width:46px;height:46px;border-radius:50%;background:${C.white};display:flex;align-items:center;justify-content:center" class="soft">${ic('bell', C.ink, 18)}</button>
</div></div>

${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}

<div style="font-size:18px;font-weight:800;color:${C.ink};margin-bottom:12px">${isToday ? (rem > 0 ? "You're on track today" : 'Goal hit! 🎉') : `Viewing ${dFull(Math.round((new Date(state.selDate) - new Date(dKey(0))) / 86400000))}`}</div>

<button onclick="app.tab('progress')" style="width:100%;border-radius:26px;padding:22px;display:flex;align-items:center;gap:18px;margin-bottom:14px;background:${C.brand};border:none;text-align:left;cursor:pointer" class="soft-lg">
${donutRing([{ v: sum.cal, max: t.cal, color: '#fff', bg: 'rgba(255,255,255,.28)' }], 112, pct + '%', 'of goal')}
<div style="flex:1">
<div style="font-size:19px;font-weight:800;color:#fff;margin-bottom:8px">${rem >= 0 ? rem + ' kcal left' : Math.abs(rem) + ' kcal over'}</div>
<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:rgba(255,255,255,.8)"><span>Goal</span><span style="color:#fff;font-weight:700">${t.cal} kcal</span></div>
<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px;color:rgba(255,255,255,.8)"><span>Eaten</span><span style="color:#fff;font-weight:700">${sum.cal} kcal</span></div>
<div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;background:rgba(255,255,255,.22);color:#fff">View breakdown ${ic('chevR', '#fff', 12)}</div>
</div></button>

<div style="display:flex;gap:10px;margin-bottom:16px">
${quick('flame', C.brand, state.streak || 0, 'Streak')}
${quick('scale', C.action, Math.round(sum.pro) + 'g', 'Protein')}
${quick('water', C.gold, state.log.water, 'Water')}
${quick('check', C.actionDark, items, 'Items')}
</div>

<div style="display:flex;align-items:center;gap:14px;border-radius:20px;padding:16px 18px;margin-bottom:22px;background:${C.brandSoft}">
<div style="width:40px;height:40px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('bulb', C.brand, 20)}</div>
<div style="flex:1"><div style="font-size:13px;font-weight:800;color:${C.ink};margin-bottom:2px">Today's focus</div>
<div style="font-size:13px;color:${C.sub};line-height:1.4">${proLeft > 0 ? `${proLeft}g of protein to go — a shake or yoghurt closes the gap.` : 'Protein goal reached — nicely balanced day.'}</div></div>
</div>

<div class="section-hd">
<div class="lbl" style="margin:0">Daily routine</div>
<button onclick="app.sheet('addroutine')" style="width:30px;height:30px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 15)}</button>
</div>
${routineRows}`;
}
