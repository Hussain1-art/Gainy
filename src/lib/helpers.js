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

// ─── PROGRESS ENGINE ──────────────────────────────────────────────────────
// Weight log is an ascending array of { d: 'YYYY-MM-DD', kg: Number }.
export function upsertWeight(weightLog, d, kg) {
  const arr = Array.isArray(weightLog) ? weightLog.slice() : [];
  const i = arr.findIndex(e => e.d === d);
  if (i >= 0) arr[i] = { d, kg }; else arr.push({ d, kg });
  arr.sort((a, b) => (a.d < b.d ? -1 : 1));
  return arr;
}

// Δ since start, Δ since previous entry, and remaining to target.
export function weightChanges(user) {
  const log = Array.isArray(user.weightLog) ? user.weightLog : [];
  const current = log.length ? log[log.length - 1].kg : user.weight;
  const start = user.startWeight ?? current;
  const prev = log.length > 1 ? log[log.length - 2].kg : start;
  return {
    current,
    start,
    target: user.tWeight,
    sinceStart: Math.round((current - start) * 10) / 10,
    sinceLast: Math.round((current - prev) * 10) / 10,
    toTarget: Math.round((current - user.tWeight) * 10) / 10,
    entries: log.length,
  };
}

// 7-day averages over days that actually have a log (zeros excluded so a
// single logged day doesn't read as a 7th of itself).
export function weeklyAverages(cache) {
  let cal = 0, pro = 0, n = 0;
  for (let o = -6; o <= 0; o++) {
    const s = cache[dKey(o)];
    if (s && s.cal > 0) { cal += s.cal; pro += s.pro; n++; }
  }
  return { avgCal: n ? Math.round(cal / n) : 0, avgPro: n ? Math.round(pro / n) : 0, days: n };
}

// ─── HTML ESCAPING (XSS protection) ───────────────────────────────────────
// Every dynamic string that originates from a user or an external API is run
// through esc() before being interpolated into an innerHTML template, so a
// product name like `<img onerror=...>` can never execute or break layout.
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

// ─── PASSWORD HASHING ─────────────────────────────────────────────────────
// SHA-256 via Web Crypto (available on https + localhost). We never store the
// raw password — only this hex digest — and compare digests on login.
export async function hashPassword(pw) {
  const data = new TextEncoder().encode('gainy:' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── OPEN FOOD FACTS ──────────────────────────────────────────────────────
// Shared normaliser: turns an OFF product record into Gainy's food shape.
// Prefers per-serving values, falls back to per-100g.
function normalizeProduct(p, code) {
  const n = p.nutriments || {};
  return {
    id: 'off-' + (code || p.code || p._id || (p.product_name || 'x')),
    name: p.product_name || 'Unknown product',
    brand: p.brands || '',
    serving: p.serving_size || 'per 100g',
    cal: Math.round(n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0),
    pro: Math.round((n['proteins_serving'] ?? n['proteins_100g'] ?? 0) * 10) / 10,
    carb: Math.round((n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? 0) * 10) / 10,
    fat: Math.round((n['fat_serving'] ?? n['fat_100g'] ?? 0) * 10) / 10,
  };
}

// Barcode lookup — no API key required. Covers most packaged products
// (Woolworths, Coles, Aldi house brands, major international brands) since
// OFF is keyed by the same GTIN/EAN barcodes printed on packaging.
export async function lookupBarcode(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
  if (!res.ok) throw new Error('network');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalizeProduct(data.product, code);
}

// Name search — returns up to 20 normalised foods. Throws on network/HTTP
// failure so callers can fall back to the local food list.
export async function searchFoods(query) {
  const q = (query || '').trim();
  if (!q) return [];
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}`
    + '&search_simple=1&action=process&json=1&page_size=20'
    + '&fields=code,product_name,brands,serving_size,nutriments';
  const res = await fetch(url);
  if (!res.ok) throw new Error('network');
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  return products
    .map((p) => normalizeProduct(p, p.code))
    .filter((f) => f.name && f.name !== 'Unknown product' && f.cal > 0);
}
