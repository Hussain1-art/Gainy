import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { FOODS } from '../lib/constants.js';
import { esc } from '../lib/helpers.js';

export function renderSearch(state) {
  const q = state.search.q.trim();
  const results = q ? state.search.results : FOODS;
  const status = state.search.status;

  const row = (f, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 0;border-bottom:1px solid ${C.border}">
<div style="min-width:0;flex:1">
<div style="font-size:14px;font-weight:700;color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.brand ? esc(f.brand) + ' · ' : ''}${esc(f.serving)}</div>
<div style="font-size:11px;margin-top:5px;color:${C.sub}">
<b style="color:${C.ink}">${f.cal}</b> kcal ·
<b style="color:${C.action}">${f.pro}g</b> P ·
<b style="color:${C.gold}">${f.carb}g</b> C ·
<b style="color:${C.actionDark}">${f.fat}g</b> F</div>
</div>
<button onclick="app.pickSearchResult(${i})" style="flex-shrink:0;width:34px;height:34px;border-radius:50%;background:${C.brand};display:flex;align-items:center;justify-content:center">${ic('plus', '#fff', 16)}</button>
</div>`;

  const rows = results.map(row).join('');
  const noResults = q && status !== 'loading' && results.length === 0;

  return `<div style="font-size:26px;font-weight:800;color:${C.ink};margin-bottom:16px">Search</div>
<div style="display:flex;align-items:center;gap:10px;border-radius:24px;padding:14px 18px;margin-bottom:14px;background:${C.white}" class="soft">
${ic('progress', C.sub, 17)}
<input value="${esc(state.search.q)}" oninput="app.onSearchInput(this.value)" placeholder="Search foods, brands…" style="flex:1;font-size:14px;background:transparent;border:none;outline:none;color:${C.ink}"/>
</div>
<button onclick="app.sheet('scanner')" style="width:100%;display:flex;align-items:center;gap:14px;border-radius:22px;padding:18px;margin-bottom:18px;background:${C.brand};border:none;cursor:pointer" class="soft">
<div style="width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center">${ic('scan', '#fff', 22)}</div>
<div style="text-align:left"><div style="font-size:15px;font-weight:800;color:#fff">Scan a barcode</div>
<div style="font-size:12px;color:rgba(255,255,255,.8)">Point camera at any product</div></div>
</button>
${state.search.error ? `<div style="font-size:12px;padding:10px 14px;border-radius:14px;background:${C.warm};color:${C.ink};margin-bottom:14px">${esc(state.search.error)}</div>` : ''}
<div class="section-hd">
<div class="lbl" style="margin:0">${q ? 'Results' : 'All foods'}</div>
${status === 'loading' ? `<div style="font-size:11px;color:${C.sub}">Searching…</div>` : ''}
</div>
${rows}
${noResults ? `<div style="text-align:center;padding:22px 12px">
<div style="font-size:15px;font-weight:800;color:${C.ink};margin-bottom:4px">No foods found</div>
<div style="font-size:13px;color:${C.sub};margin-bottom:18px">Couldn't find "${esc(q)}". Add it manually or scan its barcode.</div>
<button onclick="app.sheet('manualfood')" class="btn" style="background:${C.action};color:#fff">${ic('plus', '#fff', 16)} Add food manually</button>
</div>` : `<button onclick="app.sheet('manualfood')" style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;margin-top:16px;color:${C.action};cursor:pointer">${ic('plus', C.action, 14)} Can't find it? Add manually</button>`}`;
}
