// ─── STORAGE LAYER ────────────────────────────────────────────────────────
// Phase 1: localStorage only.
// Phase 2: swap the bodies of these functions for Supabase calls —
// the rest of the app never needs to change because it only calls S.get/set/del.

const PREFIX = 'gainy:';

export const S = {
  get(key) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
    } catch {
      /* storage full or unavailable — fail silently in demo */
    }
  },
  del(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  },
};

// ─── FUTURE: SUPABASE ADAPTER (Phase 2) ──────────────────────────────────
// When ready, create src/lib/storage-supabase.js implementing the same
// { get, set, del } interface backed by `supabase.from('user_data')...`,
// then swap the import in main.js. No screen/component code changes needed.
