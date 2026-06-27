import { C } from '../lib/constants.js';
import { ic } from '../lib/icons.js';
import { calcTargets } from '../lib/helpers.js';
import { ACT_LEVELS, GOALS } from '../lib/constants.js';

// ─── FLAME MASCOT (used on splash + onboarding) ───────────────────────────
const flameMascot = `<svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="36" cy="76" rx="18" ry="5" fill="rgba(0,0,0,.15)"/>
<path d="M36 6C36 6 18 24 18 44C18 56 25.5 65 36 65C46.5 65 54 56 54 44C54 24 36 6 36 6Z" fill="#FF9500"/>
<path d="M36 14C36 14 24 30 24 42C24 50 29.5 56 36 56C42.5 56 48 50 48 42C48 30 36 14 36 14Z" fill="#FFCC00"/>
<path d="M36 30C36 30 30 36 30 42C30 46 32.7 49 36 49C39.3 49 42 46 42 42C42 36 36 30 36 30Z" fill="white" opacity="0.55"/>
<circle cx="29" cy="41" r="5" fill="white"/>
<circle cx="43" cy="41" r="5" fill="white"/>
<circle cx="29" cy="42.5" r="2.5" fill="#1a1a1a"/>
<circle cx="43" cy="42.5" r="2.5" fill="#1a1a1a"/>
<circle cx="30" cy="41.5" r="1" fill="white"/>
<circle cx="44" cy="41.5" r="1" fill="white"/>
<path d="M31 52C31 52 33 55 36 55C39 55 41 52 41 52" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

// ─── STEPPER — inline, no separate import ─────────────────────────────────
function obStepper(val, dec, inc, suffix = '') {
  return `<div style="display:flex;align-items:center;gap:20px;margin:8px 0 4px">
<button onclick="${dec};render()" style="width:48px;height:48px;border-radius:50%;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:${C.brand};flex-shrink:0">−</button>
<div style="font-size:22px;font-weight:800;color:${C.ink};min-width:100px;text-align:center">${val}${suffix}</div>
<button onclick="${inc};render()" style="width:48px;height:48px;border-radius:50%;background:${C.brandSoft};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:${C.brand};flex-shrink:0">+</button>
</div>`;
}

// ─── SPLASH ───────────────────────────────────────────────────────────────
export function renderSplash() {
  return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${C.brand}">
${flameMascot}
<div style="font-size:32px;font-weight:900;color:#fff;margin-top:10px">Gainy</div>
<div style="font-size:14px;color:rgba(255,255,255,.75);margin-top:6px">Fuel your goals.</div>
</div>`;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────
export function renderAuth(state) {
  const mode = state.sheetData.authMode || 'signup';
  return `<div class="screen" style="padding:48px 24px 40px">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
  ${flameMascot.replace('width="72"','width="48"').replace('height="80"','height="54"').replace('viewBox="0 0 72 80"','viewBox="0 0 72 80"')}
  <div style="font-size:26px;font-weight:900;color:${C.ink}">Gainy</div>
</div>
<div style="font-size:22px;font-weight:800;color:${C.ink};margin-bottom:4px">${mode === 'signup' ? 'Create account' : 'Welcome back'}</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:24px">${mode === 'signup' ? 'Set up Gainy to start tracking.' : 'Log in to continue.'}</div>
<div style="display:flex;border-radius:16px;padding:4px;background:${C.brandSoft};margin-bottom:20px">
  <button onclick="app.authMode('signup')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:700;background:${mode === 'signup' ? C.brand : 'transparent'};color:${mode === 'signup' ? '#fff' : C.brand}">Sign up</button>
  <button onclick="app.authMode('login')" style="flex:1;padding:10px;border-radius:12px;font-size:14px;font-weight:700;background:${mode === 'login' ? C.brand : 'transparent'};color:${mode === 'login' ? '#fff' : C.brand}">Log in</button>
</div>
${mode === 'signup' ? `<div class="lbl">Name</div><input class="inp" style="margin-bottom:12px" placeholder="Your name" id="au-name"/>` : ''}
<div class="lbl">Email</div><input class="inp" type="email" style="margin-bottom:12px" placeholder="you@example.com" id="au-email"/>
<div class="lbl">Password</div><input class="inp" type="password" style="margin-bottom:12px" placeholder="••••••••" id="au-pw"/>
${state.loginErr ? `<div style="font-size:12px;padding:8px 12px;border-radius:10px;background:${C.brandSoft};color:${C.brand};margin-bottom:12px">${state.loginErr}</div>` : ''}
<button class="btn" style="background:${C.brand};color:#fff" onclick="app.auth()">${mode === 'signup' ? 'Continue' : 'Log in'} ${ic('chevR','#fff',15)}</button>
<div style="text-align:center;font-size:11px;margin-top:12px;color:${C.sub}">Your account is stored on this device.</div>
</div>`;
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────
export function renderOnboard(state) {
  const o = state.onboard;
  const step = o.step;
  const steps = ['goal', 'stats', 'targets'];
  const targets = calcTargets({ age: o.age, sex: o.sex, height: o.height, weight: o.weight, actLvl: o.actLvl, goal: o.goal });

  // Progress bar row
  const progressBars = steps.map((_, i) =>
    `<div style="height:5px;flex:1;border-radius:3px;background:${i <= step ? C.brand : C.border}"></div>`
  ).join('');

  // ── STEP 0: Goal ──────────────────────────────────────────────────────
  let content = '';
  if (step === 0) {
    const goalBtns = GOALS.map(g =>
      `<button onclick="app.ob('goal','${g.id}')" style="width:100%;display:flex;align-items:center;gap:16px;padding:18px;border-radius:18px;margin-bottom:10px;text-align:left;background:${o.goal === g.id ? C.brand : C.card};border:1.5px solid ${o.goal === g.id ? C.brand : C.border}">
<div style="font-size:26px">${g.icon}</div>
<div style="font-size:15px;font-weight:700;color:${o.goal === g.id ? '#fff' : C.ink}">${g.label}</div>
${o.goal === g.id ? `<div style="margin-left:auto">${ic('check','#fff',16)}</div>` : ''}
</button>`
    ).join('');
    content = `<div style="font-size:26px;font-weight:800;color:${C.ink};margin-bottom:6px">What's your goal?</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:22px">This shapes your daily targets.</div>
${goalBtns}`;

  // ── STEP 1: Stats ─────────────────────────────────────────────────────
  } else if (step === 1) {
    const lvls = ACT_LEVELS.map(a =>
      `<button onclick="app.ob('actLvl','${a.id}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-radius:16px;margin-bottom:8px;text-align:left;background:${o.actLvl === a.id ? C.brandSoft : C.card};border:1.5px solid ${o.actLvl === a.id ? C.brand : C.border}">
<div>
  <div style="font-size:14px;font-weight:700;color:${o.actLvl === a.id ? C.brand : C.ink}">${a.label}</div>
  <div style="font-size:12px;color:${C.sub};margin-top:2px">${a.desc}</div>
</div>
${o.actLvl === a.id ? ic('check', C.brand, 16) : ''}
</button>`
    ).join('');

    content = `<div style="font-size:26px;font-weight:800;color:${C.ink};margin-bottom:22px">Tell us about you</div>

<div class="lbl">SEX</div>
<div style="display:flex;gap:8px;margin-bottom:20px">
  <button onclick="app.ob('sex','m')" style="flex:1;padding:14px;border-radius:14px;font-size:14px;font-weight:700;background:${o.sex === 'm' ? C.brand : C.card};color:${o.sex === 'm' ? '#fff' : C.ink};border:1.5px solid ${o.sex === 'm' ? C.brand : C.border}">Male</button>
  <button onclick="app.ob('sex','f')" style="flex:1;padding:14px;border-radius:14px;font-size:14px;font-weight:700;background:${o.sex === 'f' ? C.brand : C.card};color:${o.sex === 'f' ? '#fff' : C.ink};border:1.5px solid ${o.sex === 'f' ? C.brand : C.border}">Female</button>
</div>

<div class="lbl">AGE</div>
${obStepper(o.age, 'app.obN("age",-1)', 'app.obN("age",1)', ' yrs')}

<div class="lbl" style="margin-top:16px">HEIGHT (CM)</div>
${obStepper(o.height, 'app.obN("height",-1)', 'app.obN("height",1)', ' cm')}

<div class="lbl" style="margin-top:16px">WEIGHT (KG)</div>
${obStepper(o.weight, 'app.obN("weight",-.5)', 'app.obN("weight",.5)', ' kg')}

${o.goal !== 'maintain' ? `<div class="lbl" style="margin-top:16px">TARGET WEIGHT (KG)</div>
${obStepper(o.tWeight, 'app.obN("tWeight",-.5)', 'app.obN("tWeight",.5)', ' kg')}` : ''}

<div class="lbl" style="margin-top:20px">ACTIVITY LEVEL</div>
<div style="margin-top:8px">${lvls}</div>`;

  // ── STEP 2: Targets summary ────────────────────────────────────────────
  } else {
    content = `<div style="font-size:26px;font-weight:800;color:${C.ink};margin-bottom:6px">Your daily targets</div>
<div style="font-size:14px;color:${C.sub};margin-bottom:22px">Adjust anytime in Progress.</div>

<div style="border-radius:24px;padding:24px;background:${C.brand};margin-bottom:16px;box-shadow:0 8px 24px rgba(239,115,5,.25)">
  <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.7);letter-spacing:.06em;margin-bottom:6px">DAILY CALORIES</div>
  <div style="font-size:42px;font-weight:900;color:#fff;line-height:1">${targets.cal}<span style="font-size:18px;font-weight:600"> kcal</span></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px">
  <div style="background:${C.card};border-radius:16px;padding:14px;text-align:center">
    <div style="font-size:20px;font-weight:800;color:${C.brand}">${targets.pro}g</div>
    <div style="font-size:11px;color:${C.sub};margin-top:3px">Protein</div>
  </div>
  <div style="background:${C.card};border-radius:16px;padding:14px;text-align:center">
    <div style="font-size:20px;font-weight:800;color:${C.brand}">${targets.carb}g</div>
    <div style="font-size:11px;color:${C.sub};margin-top:3px">Carbs</div>
  </div>
  <div style="background:${C.card};border-radius:16px;padding:14px;text-align:center">
    <div style="font-size:20px;font-weight:800;color:${C.brand}">${targets.fat}g</div>
    <div style="font-size:11px;color:${C.sub};margin-top:3px">Fat</div>
  </div>
</div>`;
  }

  return `<div class="screen">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
${step > 0 ? `<button onclick="app.obStep(-1)" style="width:38px;height:38px;border-radius:50%;background:${C.card};display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('chevL', C.ink, 16)}</button>` : '<div style="width:38px"></div>'}
<div style="flex:1;display:flex;gap:6px">${progressBars}</div>
</div>
${content}
<div style="height:90px"></div>
</div>
<div style="position:absolute;bottom:0;left:0;right:0;padding:12px 24px 36px;background:${C.bg}">
<button class="btn" style="background:${C.brand};color:#fff;font-size:15px;font-weight:800" onclick="app.obStep(1)">
${step === 2 ? 'Start tracking' : 'Continue'} ${ic('chevR','#fff',16)}</button>
</div>`;
}
