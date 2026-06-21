import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { FOODS } from '../lib/constants.js';

export function renderSearch(state) {
  const q = (state.sheetData.searchQ || '').toLowerCase();
  const results = q ? FOODS.filter(f => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)) : FOODS;
  const rows = results.map(f => `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${C.border}">
<div><div style="font-size:14px;font-weight:600;color:${C.ink}">${f.name}</div>
<div style="font-size:12px;color:${C.sub};margin-top:2px">${f.brand ? f.brand + ' · ' : ''}${f.serving}</div></div>
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:12px;font-weight:600;color:${C.ink}">${f.cal} kcal</div>
<button onclick="app.addFoodFromSearch('${f.id}')" style="width:28px;height:28px;border-radius:50%;background:${C.blueSoft};display:flex;align-items:center;justify-content:center">${ic('plus', C.blue, 14)}</button>
</div></div>`).join('');

  return `<div style="font-size:24px;font-weight:800;color:${C.ink};margin-bottom:16px">Search</div>
<div style="display:flex;align-items:center;gap:10px;border-radius:24px;padding:12px 16px;margin-bottom:14px;background:${C.card};border:1px solid ${C.border}">
${ic('progress', C.sub, 17)}
<input value="${state.sheetData.searchQ || ''}" oninput="state.sheetData.searchQ=this.value;render()" placeholder="Search foods, brands…" style="flex:1;font-size:14px;background:transparent;border:none;outline:none;color:${C.ink}"/>
</div>
<button onclick="app.sheet('scanner')" style="width:100%;display:flex;align-items:center;gap:12px;border-radius:16px;padding:16px;margin-bottom:20px;background:${C.blue};border:none;cursor:pointer">
<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center">${ic('scan', '#fff', 20)}</div>
<div style="text-align:left"><div style="font-size:14px;font-weight:700;color:#fff">Scan a barcode</div>
<div style="font-size:12px;color:rgba(255,255,255,.7)">Point camera at any product</div></div>
</button>
<div class="lbl">${q ? 'Results' : 'All foods'}</div>${rows}
${results.length === 0 ? `<div style="text-align:center;padding:24px;font-size:14px;color:${C.sub}">No foods found. Try scanning a barcode.</div>` : ''}`;
}
