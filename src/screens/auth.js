import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { stepper } from '../lib/ui.js';
import { calcTargets } from '../lib/helpers.js';
import { ACT_LEVELS, GOALS } from '../lib/constants.js';

// ─── SPLASH ───────────────────────────────────────────────────────────────
export function renderSplash() {
  return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${C.blue}">
<div style="width:80px;height:80px;border-radius:24px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;margin-bottom:16px">
<span style="font-size:40px;font-weight:800;color:#fff;font-family:Georgia,serif">G</span></div>
<div style="font-size:30px;font-weight:800;color:#fff">Gainy</div>
<div style="font-size:14px;color:rgba(255,255,255,.7);margin-top:8px">Fuel your goals.</div></div>`;
}

// ─── AUTH (simple signup/login, no API key) ──────────────────────────────
export function renderAuth(state) {
  const mode = state.sheetData.authMode || 'signup';
  return `<div class="screen" style="padding:48px 24px 40px">
<div style="width:48px;height:48px;border-radius:16px;background:${C.blue};display:flex;align-items:center;justify-content:center;margin-bottom:16px">
<span style="font-size:22px;font-weight:800;color:#fff;font-family:Georgia,serif">G</span></div>
<div style="font-size:22px;font-weight:800;color:${C.ink};margin-bottom:4px">${mode === 'signup' ? 'Create account' : 'Welcome back'}</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:24px">${mode === 'signup' ? 'Set up Gainy to start tracking.' : 'Log in to continue.'}</div>
<div style="display:flex;border-radius:16px;padding:4px;background:${C.blueSoft};margin-bottom:20px">
<button onclick="app.authMode('signup')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:600;background:${mode === 'signup' ? C.blue : 'transparent'};color:${mode === 'signup' ? '#fff' : C.blue}">Sign up</button>
<button onclick="app.authMode('login')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:600;background:${mode === 'login' ? C.blue : 'transparent'};color:${mode === 'login' ? '#fff' : C.blue}">Log in</button>
</div>
${mode === 'signup' ? `<div class="lbl">Name</div><input class="inp" style="margin-bottom:12px" placeholder="Your name" id="au-name"/>` : ''}
<div class="lbl">Email</div><input class="inp" type="email" style="margin-bottom:12px" placeholder="you@example.com" id="au-email"/>
<div class="lbl">Password</div><input class="inp" type="password" style="margin-bottom:12px" placeholder="••••••••" id="au-pw"/>
${state.loginErr ? `<div style="font-size:12px;padding:8px 12px;border-radius:10px;background:${C.ice};color:${C.blueDark};margin-bottom:12px">${state.loginErr}</div>` : ''}
<button class="btn" style="background:${C.blue};color:#fff" onclick="app.auth()">${mode === 'signup' ? 'Continue' : 'Log in'}</button>
<div style="text-align:center;font-size:11px;margin-top:12px;color:${C.sub}">Your data is stored securely and stays yours.</div></div>`;
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────
export function renderOnboard(state) {
  const o = state.onboard;
  const steps = ['goal', 'stats', 'targets'];
  const step = o.step;
  const targets = calcTargets({ age: o.age, sex: o.sex, height: o.height, weight: o.weight, actLvl: o.actLvl, goal: o.goal });
  const progressBars = steps.map((_, i) => `<div style="height:6px;flex:1;border-radius:3px;background:${i <= step ? C.blue : C.border}"></div>`).join('');

  let content = '';
  if (step === 0) {
    const goalBtns = GOALS.map(g => `<button onclick="app.ob('goal','${g.id}')" style="width:100%;display:flex;align-items:center;gap:16px;padding:16px;border-radius:16px;margin-bottom:10px;text-align:left;background:${o.goal === g.id ? C.blue : C.card};border:1px solid ${o.goal === g.id ? C.blue : C.border}">
<div style="font-size:24px">${g.icon}</div>
<div><div style="font-size:14px;font-weight:700;color:${o.goal === g.id ? '#fff' : C.ink}">${g.label}</div></div>
</button>`).join('');
    content = `<div style="font-size:22px;font-weight:800;color:${C.ink};margin-bottom:4px">What's your goal?</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:20px">This shapes your daily targets.</div>${goalBtns}`;
  } else if (step === 1) {
    const lvls = ACT_LEVELS.map(a => `<button onclick="app.ob('actLvl','${a.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:12px;margin-bottom:8px;text-align:left;background:${o.actLvl === a.id ? C.blue : C.card};border:1px solid ${o.actLvl === a.id ? C.blue : C.border}">
<div><div style="font-size:14px;font-weight:600;color:${o.actLvl === a.id ? '#fff' : C.ink}">${a.label}</div>
<div style="font-size:12px;color:${o.actLvl === a.id ? 'rgba(255,255,255,.7)' : C.sub}">${a.desc}</div></div>
${o.actLvl === a.id ? `<div style="color:#fff">${ic('check', '#fff', 16)}</div>` : ''}
</button>`).join('');
    content = `<div style="font-size:22px;font-weight:800;color:${C.ink};margin-bottom:20px">Tell us about you</div>
<div class="lbl">Sex</div>
<div style="display:flex;gap:8px;margin-bottom:16px">
<button onclick="app.ob('sex','m')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:600;background:${o.sex === 'm' ? C.blue : C.card};color:${o.sex === 'm' ? '#fff' : C.ink};border:1px solid ${o.sex === 'm' ? C.blue : C.border}">Male</button>
<button onclick="app.ob('sex','f')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:600;background:${o.sex === 'f' ? C.blue : C.card};color:${o.sex === 'f' ? '#fff' : C.ink};border:1px solid ${o.sex === 'f' ? C.blue : C.border}">Female</button>
</div>
<div class="lbl">Age</div>${stepper('ob-age', o.age, 'app.obN("age",-1)', 'app.obN("age",1)', ' yrs')}
<div class="lbl" style="margin-top:14px">Height (cm)</div>${stepper('ob-h', o.height, 'app.obN("height",-1)', 'app.obN("height",1)', ' cm')}
<div class="lbl" style="margin-top:14px">Weight (kg)</div>${stepper('ob-w', o.weight, 'app.obN("weight",-.5)', 'app.obN("weight",.5)', ' kg')}
${o.goal !== 'maintain' ? `<div class="lbl" style="margin-top:14px">Target weight (kg)</div>${stepper('ob-tw', o.tWeight, 'app.obN("tWeight",-.5)', 'app.obN("tWeight",.5)', ' kg')}` : ''}
<div class="lbl" style="margin-top:14px">Activity level</div>${lvls}`;
  } else {
    content = `<div style="font-size:22px;font-weight:800;color:${C.ink};margin-bottom:4px">Your daily targets</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:20px">Adjust anytime in Progress.</div>
<div style="border-radius:24px;padding:20px;background:${C.blue};margin-bottom:16px">
<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.7);margin-bottom:4px">DAILY CALORIES</div>
<div style="font-size:36px;font-weight:800;color:#fff">${targets.cal}<span style="font-size:16px;font-weight:600"> kcal</span></div></div>
<div class="grid3">
<div class="card" style="text-align:center"><div style="font-size:18px;font-weight:700;color:${C.blue}">${targets.pro}g</div><div style="font-size:11px;color:${C.sub}">Protein</div></div>
<div class="card" style="text-align:center"><div style="font-size:18px;font-weight:700;color:${C.sky}">${targets.carb}g</div><div style="font-size:11px;color:${C.sub}">Carbs</div></div>
<div class="card" style="text-align:center"><div style="font-size:18px;font-weight:700;color:${C.blueDark}">${targets.fat}g</div><div style="font-size:11px;color:${C.sub}">Fat</div></div>
</div>`;
  }

  return `<div class="screen">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
${step > 0 ? `<button onclick="app.obStep(-1)" style="width:36px;height:36px;border-radius:50%;background:${C.card};border:1px solid ${C.border};display:flex;align-items:center;justify-content:center">${ic('chevL', C.ink)}</button>` : ''}
<div style="flex:1;display:flex;gap:6px">${progressBars}</div>
</div>
${content}
</div>
<div style="position:absolute;bottom:0;left:0;right:0;padding:12px 24px 32px;background:${C.bg}">
<button class="btn" style="background:${C.blue};color:#fff" onclick="app.obStep(1)">
${step === 2 ? 'Start tracking' : 'Continue'} ${ic('chevR', '#fff', 16)}</button></div>`;
}
