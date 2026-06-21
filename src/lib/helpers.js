import { ACT_LEVELS } from './constants.js';

// ─── DATE HELPERS ─────────────────────────────────────────────────────────
export function dKey(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toISOString().slice(0, 10);
}
export function dDay(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
export function dDate(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.getDate();
}
export function dFull(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── NUTRITION CALCULATIONS ───────────────────────────────────────────────
export function calcTargets({ age, sex, height, weight, actLvl, goal }) {
  let bmr = sex === 'f'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  const m = ACT_LEVELS.find(a => a.id === actLvl)?.m || 1.2;
  let tdee = bmr * m;
  if (goal === 'lose') tdee -= 450;
  if (goal === 'gain') tdee += 300;
  const cal = Math.round(tdee / 10) * 10;
  const pro = Math.round(weight * (goal === 'gain' ? 2 : 1.8));
  const fat = Math.round((cal * 0.25) / 9);
  const carb = Math.round((cal - pro * 4 - fat * 9) / 4);
  return { cal, pro, carb, fat, water: 8 };
}

export function emptyLog(cats) {
  const meals = {};
  cats.forEach(c => { meals[c.id] = []; });
  return { meals, acts: [], water: 0, done: {} };
}

export function fixLog(log, cats) {
  const meals = { ...(log.meals || {}) };
  cats.forEach(c => { if (!meals[c.id]) meals[c.id] = []; });
  return { meals, acts: log.acts || [], water: log.water || 0, done: log.done || {} };
}

export function sumLog(log) {
  let cal = 0, pro = 0, carb = 0, fat = 0;
  Object.values(log.meals).forEach(items => items.forEach(it => {
    cal += it.cal; pro += it.pro; carb += it.carb; fat += it.fat;
  }));
  return { cal, pro, carb, fat };
}

export function goalHit(s, t) {
  return !!s && s.cal >= t.cal * 0.8 && s.cal <= t.cal * 1.05;
}

export function autoCat(cats) {
  const h = new Date().getHours();
  const want = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snacks';
  return (cats.find(c => c.id === want) || cats[0]).id;
}

// ─── BARCODE LOOKUP ───────────────────────────────────────────────────────
// Open Food Facts only — no API key required. Covers most packaged
// products including Woolworths, Coles, Aldi house brands and major
// international brands, since OFF is a community database keyed by
// the same GTIN/EAN barcodes used on physical packaging.
export async function lookupBarcode(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
  if (!res.ok) throw new Error('network');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments || {};
  return {
    id: 'off-' + code,
    name: p.product_name || 'Unknown product',
    brand: p.brands || '',
    serving: p.serving_size || 'per 100g',
    cal: Math.round(n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0),
    pro: Math.round((n['proteins_serving'] ?? n['proteins_100g'] ?? 0) * 10) / 10,
    carb: Math.round((n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? 0) * 10) / 10,
    fat: Math.round((n['fat_serving'] ?? n['fat_100g'] ?? 0) * 10) / 10,
  };
}
