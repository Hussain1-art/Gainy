import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { esc } from '../lib/helpers.js';
import { ACT_LEVELS, GOALS } from '../lib/constants.js';

export function renderProfile(state) {
  const u = state.user;
  const gLabel = GOALS.find(g => g.id === u.goal)?.label || '';
  const gIcon = GOALS.find(g => g.id === u.goal)?.icon || '';
  const aLabel = ACT_LEVELS.find(a => a.id === u.actLvl)?.label || '';
  const rows = [
    ['Age', u.age + ' yrs'], ['Sex', u.sex === 'm' ? 'Male' : 'Female'],
    ['Height', u.height + ' cm'], ['Weight', u.weight + ' kg'],
    ['Target weight', u.tWeight + ' kg'], ['Activity', aLabel],
  ];

  return `<div style="font-size:26px;font-weight:800;color:${C.ink};margin-bottom:22px">Profile</div>
<div style="display:flex;align-items:center;gap:16px;margin-bottom:22px">
<div style="width:68px;height:68px;border-radius:50%;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:${C.brand}">${esc(u.name.charAt(0).toUpperCase())}</div>
<div><div style="font-size:19px;font-weight:800;color:${C.ink}">${esc(u.name)}</div>
<div style="font-size:12px;color:${C.sub}">${esc(u.email || '')}</div></div>
</div>
<div style="border-radius:22px;padding:20px;margin-bottom:22px;background:${C.brand}" class="soft">
<div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.8);margin-bottom:8px">YOUR GOAL</div>
<div style="font-size:19px;font-weight:800;color:#fff;margin-bottom:12px">${gIcon} ${esc(gLabel)}</div>
<div style="display:flex;gap:16px;font-size:12px;color:rgba(255,255,255,.9)">
<span><b style="color:#fff">${u.targets.cal}</b> kcal</span>
<span><b style="color:#fff">${u.targets.pro}g</b> P</span>
<span><b style="color:#fff">${u.targets.carb}g</b> C</span>
<span><b style="color:#fff">${u.targets.fat}g</b> F</span>
</div></div>
<div class="lbl">Your stats</div>
<div class="card" style="margin-bottom:22px">
${rows.map(([k, v], i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 0;${i < rows.length - 1 ? 'border-bottom:1px solid ' + C.border : ''}">
<div style="font-size:14px;color:${C.ink}">${esc(k)}</div><div style="font-size:14px;font-weight:700;color:${C.sub}">${esc(v)}</div></div>`).join('')}
</div>
<button onclick="app.sheet('editprofile')" class="btn" style="background:${C.action};color:#fff;margin-bottom:10px">${ic('edit', '#fff', 15)} Edit goals &amp; stats</button>
<button onclick="app.logout()" class="btn" style="background:${C.card};color:${C.ink};margin-bottom:10px">${ic('logout', C.ink, 15)} Log out</button>
<button onclick="app.reset()" class="btn" style="background:transparent;color:${C.sub}">${ic('reset', C.sub, 15)} Delete account &amp; data</button>`;
}
