import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing, weekCalendarHTML } from '../lib/ui.js';
import { sumLog, dKey, dFull } from '../lib/helpers.js';

export function renderHome(state) {
  const isToday = state.selDate === dKey(0);
  const sum = isToday ? sumLog(state.log) : (state.cache[state.selDate] || { cal: 0, pro: 0, carb: 0, fat: 0 });
  const t = state.user.targets;
  const rem = t.cal - sum.cal;
  const pct = Math.round((sum.cal / t.cal) * 100);
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const loggedCats = state.cats.filter(c => (state.log.meals[c.id] || []).length > 0).map(c => c.label).join(', ');

  const routineRows = state.routine.map(r => {
    let done = false, label = r.label;
    if (r.type === 'water') { done = state.log.water >= t.water; label = `Drink water (${state.log.water}/${t.water})`; }
    else if (r.type === 'meal') { const cat = state.cats.find(c => c.id === r.mid); done = cat && (state.log.meals[cat.id] || []).length > 0; label = cat ? cat.label : r.label; }
    else { done = !!state.log.done[r.id]; }
    return `<button onclick="app.toggleRoutine('${r.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;border-radius:16px;padding:12px 16px;margin-bottom:8px;text-align:left;background:${done ? C.blueSoft : C.card};border:1px solid ${C.border}">
<div style="display:flex;align-items:center;gap:12px;font-size:14px;font-weight:600;color:${C.ink}">
<span>${r.icon}</span>${label}</div>
<div style="display:flex;align-items:center;gap:8px">
<span style="font-size:11px;font-weight:600;color:${done ? C.blue : C.sub}">${done ? 'Done' : 'Tap'}</span>
<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${done ? C.blue : C.border}">${done ? ic('check', '#fff', 13) : ''}</div>
</div></button>`;
  }).join('');

  return `
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
<div><div style="font-size:14px;color:${C.sub}">${greet},</div><div style="font-size:24px;font-weight:800;color:${C.ink}">${state.user.name}</div></div>
<div style="display:flex;gap:8px">
<button onclick="app.sheet('quickadd')" style="width:40px;height:40px;border-radius:50%;background:${C.blue};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 18)}</button>
<button onclick="app.sheet('reminders')" style="width:40px;height:40px;border-radius:50%;background:${C.card};border:1px solid ${C.border};display:flex;align-items:center;justify-content:center">${ic('bell', C.blue, 18)}</button>
</div></div>
${weekCalendarHTML({ wOff: state.wOff, selDate: state.selDate, cache: state.cache, targets: t })}
<div style="font-size:18px;font-weight:800;color:${C.ink};margin-bottom:12px">${isToday ? (rem > 0 ? "You're on track today!" : 'Goal hit! 🎉') : `Viewing ${dFull(Math.round((new Date(state.selDate) - new Date(dKey(0))) / 86400000))}`}</div>
<button onclick="app.tab('progress')" style="width:100%;border-radius:24px;padding:20px;display:flex;align-items:center;gap:16px;margin-bottom:12px;background:${C.blue};border:none;text-align:left;cursor:pointer">
${donutRing([{ v: sum.cal, max: t.cal, color: '#fff', bg: 'rgba(255,255,255,.2)' }], 108, pct + '%', 'of goal')}
<div style="flex:1">
<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">${rem >= 0 ? rem + ' kcal left' : Math.abs(rem) + ' kcal over'}</div>
<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:rgba(255,255,255,.7)"><span>Goal</span><span style="color:#fff;font-weight:700">${t.cal} kcal</span></div>
<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px;color:rgba(255,255,255,.7)"><span>Eaten</span><span style="color:#fff;font-weight:700">${sum.cal} kcal</span></div>
<div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.16);color:#fff">View full breakdown ${ic('chevR', '#fff', 12)}</div>
</div></button>
<button onclick="app.tab('progress')" style="width:100%;border-radius:16px;padding:16px;margin-bottom:12px;background:${C.card};border:1px solid ${C.border};text-align:left;cursor:pointer">
<div style="font-size:14px;font-weight:700;color:${C.ink}">${Object.values(state.log.meals).reduce((s, m) => s + m.length, 0)} items logged today</div>
<div style="font-size:12px;margin-top:2px;color:${C.sub}">${loggedCats || 'Nothing logged yet — tap to add food'}</div>
</button>
<div style="border-radius:16px;margin-bottom:20px;padding:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:${C.sub};background:${C.blueSoft};border:1px dashed ${C.ice}">Advertisement space</div>
<div class="section-hd">
<div class="lbl" style="margin:0">Daily routine</div>
<button onclick="app.sheet('addroutine')" style="width:28px;height:28px;border-radius:50%;background:${C.blue};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 14)}</button>
</div>
${routineRows}`;
}
