import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { FOODS } from '../lib/constants.js';
import { esc } from '../lib/helpers.js';

export function renderSearch(state) {
  const q = state.search.q.trim();
  // With a query: show whatever runSearch collected (local + API). Empty: the
  // curated local list, so the screen is never blank on first open.
  const results = q ? state.search.results : FOODS;
  const status = state.search.status;

  const row = (f, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid ${C.border}">
<div style="min-width:0;flex:1">
<div style="font-size:14px;font-weight:600;color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.brand ? esc(f.brand) + ' · ' : ''}${esc(f.serving)}</div>
<div style="font-size:11px;margin-top:4px;color:${C.sub}">
<b style="color:${C.ink}">${f.cal}</b> kcal ·
<b style="color:${C.blue}">${f.pro}g</b> P ·
<b style="color:${C.sky}">${f.carb}g</b> C ·
<b style="color:${C.blueDark}">${f.fat}g</b> F</div>
</div>
<button onclick="app.pickSearchResult(${i})" style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('plus', C.blue, 14)}</button>
</div>`;

  const rows = results.map(row).join('');
  const noResults = q && status !== 'loading' && results.length === 0;

  return `<div style="font-size:24px;font-weight:800;color:${C.ink};margin-bottom:16px">Search</div>
<div style="display:flex;align-items:center;gap:10px;border-radius:24px;padding:12px 16px;margin-bottom:14px;background:${C.card};border:1px solid ${C.border}">
${ic('progress', C.sub, 17)}
<input value="${esc(state.search.q)}" oninput="app.onSearchInput(this.value)" placeholder="Search foods, brands…" style="flex:1;font-size:14px;background:transparent;border:none;outline:none;color:${C.ink}"/>
</div>
<button onclick="app.sheet('scanner')" style="width:100%;display:flex;align-items:center;gap:12px;border-radius:16px;padding:16px;margin-bottom:16px;background:${C.blue};border:none;cursor:pointer">
<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center">${ic('scan', '#fff', 20)}</div>
<div style="text-align:left"><div style="font-size:14px;font-weight:700;color:#fff">Scan a barcode</div>
<div style="font-size:12px;color:rgba(255,255,255,.7)">Point camera at any product</div></div>
</button>
${state.search.error ? `<div style="font-size:12px;padding:8px 12px;border-radius:10px;background:${C.ice};color:${C.blueDark};margin-bottom:12px">${esc(state.search.error)}</div>` : ''}
<div class="section-hd">
<div class="lbl" style="margin:0">${q ? 'Results' : 'All foods'}</div>
${status === 'loading' ? `<div style="font-size:11px;color:${C.sub}">Searching…</div>` : ''}
</div>
${rows}
${noResults ? `<div style="text-align:center;padding:20px 12px">
<div style="font-size:14px;font-weight:600;color:${C.ink};margin-bottom:4px">No foods found</div>
<div style="font-size:12px;color:${C.sub};margin-bottom:16px">Couldn't find "${esc(q)}". Add it manually or scan its barcode.</div>
<button onclick="app.sheet('manualfood')" class="btn" style="background:${C.blue};color:#fff">${ic('plus', '#fff', 15)} Add food manually</button>
</div>` : `<button onclick="app.sheet('manualfood')" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;margin-top:14px;color:${C.blue};cursor:pointer">${ic('plus', C.blue, 13)} Can't find it? Add manually</button>`}`;
}
