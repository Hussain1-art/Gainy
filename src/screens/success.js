import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { donutRing } from '../lib/ui.js';
import { sumLog, esc } from '../lib/helpers.js';

// Celebration takeover shown after a new food is logged. A deliberate,
// warm reward beat — the thing that separates a wellness app from a
// calorie dashboard.
export function renderSuccess(state) {
  const t = state.user.targets;
  const sum = sumLog(state.log);
  const calLeft = t.cal - sum.cal;
  const proLeft = Math.round(t.pro - sum.pro);
  const pctLabel = Math.round(Math.min(1, sum.cal / t.cal) * 100) + '%';

  // Deterministic, rule-based encouragement (not an AI call).
  const tip = proLeft > 15
    ? `Try to get ${Math.min(proLeft, 40)}g of protein in your next meal.`
    : calLeft > 0
      ? "You're pacing well — keep your next meal balanced to finish strong."
      : "You've reached your calories — lighter, protein-forward choices from here.";

  const confetti = ['✦', '✺', '〜', '✧', '⌣', '✦', '〜', '✧']
    .map((s, i) => {
      const angle = (i / 8) * 360;
      const colors = [C.brand, C.gold, C.action, C.warm];
      return `<span style="position:absolute;left:50%;top:50%;font-size:${12 + (i % 3) * 3}px;color:${colors[i % 4]};transform:rotate(${angle}deg) translateY(-64px)">${s}</span>`;
    }).join('');

  return `
<div class="pop" style="position:relative;width:160px;height:160px;margin:8px auto 4px">
${confetti}
<div style="position:absolute;inset:24px;border-radius:50%;background:${C.warm};display:flex;align-items:center;justify-content:center;font-size:52px">🥗</div>
<div style="position:absolute;right:24px;bottom:24px;width:40px;height:40px;border-radius:50%;background:${C.action};border:3px solid ${C.bg};display:flex;align-items:center;justify-content:center">${ic('check', '#fff', 20)}</div>
</div>

<div class="rise" style="text-align:center;margin-bottom:24px">
<div style="font-size:26px;font-weight:800;color:${C.ink}">Nice addition!</div>
<div style="font-size:14px;color:${C.sub};margin-top:4px">You've logged a great choice.</div>
</div>

<div class="rise rise-1" style="display:flex;align-items:center;gap:14px;background:${C.sage};border-radius:20px;padding:16px 18px;margin-bottom:14px">
<div style="flex:1;font-size:14px;font-weight:600;color:${C.actionDark};line-height:1.4">This helps you get closer to hitting your goals.</div>
<div style="color:${C.action}">${ic('trend', C.action, 26)}</div>
</div>

<div class="rise rise-2 card-white" style="display:flex;align-items:center;gap:18px;margin-bottom:18px">
${donutRing([{ v: Math.max(0, sum.cal), max: t.cal, color: C.brand, bg: C.warm }], 96, calLeft >= 0 ? Math.abs(calLeft) : '+' + Math.abs(calLeft), calLeft >= 0 ? 'kcal left' : 'kcal over')}
<div style="flex:1">
<div style="font-size:17px;font-weight:800;color:${C.ink};margin-bottom:4px">${calLeft >= 0 ? 'Keep going!' : 'Goal reached 🎉'}</div>
<div style="font-size:13px;color:${C.sub};line-height:1.45">${calLeft >= 0 ? 'You can still hit your target for the day.' : "You're over today's goal — that's okay, tomorrow's a fresh plate."} (${pctLabel} of goal)</div>
</div>
</div>

<button onclick="app.closeSuccess()" class="btn rise rise-2" style="background:${C.actionDark};color:#fff;margin-bottom:12px">View my day</button>
<button onclick="app.successAddAnother()" class="btn rise rise-3" style="background:${C.card};color:${C.ink};margin-bottom:20px">${ic('plus', C.ink, 16)} Add another</button>

<div class="rise rise-3" style="display:flex;align-items:center;gap:14px;background:${C.brandSoft};border-radius:20px;padding:16px 18px">
<div style="width:40px;height:40px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('bulb', C.brand, 20)}</div>
<div style="flex:1">
<div style="font-size:13px;font-weight:800;color:${C.ink};margin-bottom:2px">Coach tip</div>
<div style="font-size:13px;color:${C.sub};line-height:1.4">${esc(tip)}</div>
</div>
</div>`;
}
