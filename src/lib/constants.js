// ─── DESIGN TOKENS · Gainy UI V2 ──────────────────────────────────────────
// Warm, premium-wellness palette. Green = commit/confirm action,
// orange = brand / energy / add, gold + amber = reward moments.
export const C = {
  bg: '#F7F8F7',         // app canvas
  card: '#EDEAE8',       // warm greige surface
  cardSoft: '#F2EFEC',   // lighter inset
  white: '#FFFFFF',      // elevated hero surfaces
  brand: '#EF7305',      // primary brand / add / energy
  brandDark: '#D8650A',  // brand pressed
  brandSoft: '#FCEBDA',  // soft orange wash
  gold: '#EFCC15',       // accent / streak fills
  warm: '#FFDD9B',       // warm highlight wash / ring track
  ink: '#232323',        // primary text
  sub: '#8A857F',        // muted text
  border: '#E3DED9',     // hairline
  action: '#6B8B5E',     // confirm CTA / selected / on-track (sage)
  actionDark: '#3A4A2A', // emphasis CTA (deep olive)
  sage: '#E9EFE1',       // sage tint card
  scan: '#1A1A1A',       // scanner immersive stage

  // Legacy aliases — keep any untouched reference on-palette.
  blue: '#EF7305',
  blueDark: '#3A4A2A',
  blueSoft: '#FCEBDA',
  ice: '#FFDD9B',
  sky: '#EFCC15',
};

// ─── FOOD DATABASE ────────────────────────────────────────────────────────
export const FOODS = [
  { id: 'banana', name: 'Banana', brand: '', serving: '1 medium (118g)', cal: 105, pro: 1.3, carb: 27, fat: 0.4 },
  { id: 'yoghurt', name: 'Greek yoghurt', brand: 'Full fat', serving: '200g', cal: 130, pro: 11, carb: 9, fat: 4 },
  { id: 'chicken', name: 'Chicken breast', brand: 'Cooked', serving: '100g', cal: 165, pro: 31, carb: 0, fat: 3.6 },
  { id: 'rice', name: 'Brown rice', brand: 'Cooked', serving: '100g', cal: 140, pro: 3, carb: 30, fat: 1 },
  { id: 'oats', name: 'Rolled oats', brand: 'Dry', serving: '40g', cal: 150, pro: 5, carb: 27, fat: 3 },
  { id: 'almonds', name: 'Almonds', brand: '', serving: '28g', cal: 164, pro: 6, carb: 6, fat: 14 },
  { id: 'egg', name: 'Egg', brand: 'Large', serving: '1 egg', cal: 78, pro: 6, carb: 0.6, fat: 5 },
  { id: 'avocado', name: 'Avocado', brand: '', serving: '1 medium', cal: 240, pro: 3, carb: 12, fat: 22 },
  { id: 'salmon', name: 'Salmon', brand: 'Cooked', serving: '100g', cal: 206, pro: 22, carb: 0, fat: 12 },
  { id: 'bread', name: 'Wholewheat bread', brand: '', serving: '1 slice', cal: 81, pro: 4, carb: 14, fat: 1 },
  { id: 'apple', name: 'Apple', brand: '', serving: '1 medium', cal: 95, pro: 0.5, carb: 25, fat: 0.3 },
  { id: 'pb', name: 'Peanut butter', brand: '', serving: '2 tbsp', cal: 188, pro: 8, carb: 6, fat: 16 },
  { id: 'shake', name: 'Protein shake', brand: 'Whey', serving: '1 scoop', cal: 160, pro: 25, carb: 8, fat: 3 },
  { id: 'milk', name: 'Full cream milk', brand: '', serving: '250ml', cal: 160, pro: 8, carb: 12, fat: 9 },
  { id: 'pasta', name: 'Pasta', brand: 'Cooked', serving: '100g', cal: 131, pro: 5, carb: 25, fat: 1.1 },
  { id: 'sweetp', name: 'Sweet potato', brand: 'Baked', serving: '1 medium', cal: 112, pro: 2, carb: 26, fat: 0.1 },
];

export const ACTS = [
  { id: 'walk', name: 'Walking', met: 3.5 },
  { id: 'run', name: 'Running', met: 9.8 },
  { id: 'cycle', name: 'Cycling', met: 7.5 },
  { id: 'strength', name: 'Strength', met: 5 },
  { id: 'yoga', name: 'Yoga', met: 2.5 },
  { id: 'swim', name: 'Swimming', met: 7 },
];

export const ACT_LEVELS = [
  { id: 'sed', label: 'Sedentary', desc: 'Little or no exercise', m: 1.2 },
  { id: 'light', label: 'Lightly active', desc: '1–3 days/week', m: 1.375 },
  { id: 'mod', label: 'Moderately active', desc: '3–5 days/week', m: 1.55 },
  { id: 'active', label: 'Very active', desc: '6–7 days/week', m: 1.725 },
];

export const GOALS = [
  { id: 'lose', label: 'Lose weight', icon: '🔥' },
  { id: 'maintain', label: 'Maintain', icon: '⚖️' },
  { id: 'gain', label: 'Build muscle', icon: '💪' },
];

export const DEF_CATS = [
  { id: 'breakfast', label: 'Breakfast', icon: '☕' },
  { id: 'lunch', label: 'Lunch', icon: '🥗' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' },
  { id: 'snacks', label: 'Snacks', icon: '🍎' },
];

export const DEF_ROUTINE = [
  { id: 'water', label: 'Drink water', type: 'water', icon: '💧' },
  { id: 'rb', label: 'Breakfast', type: 'meal', mid: 'breakfast', icon: '☕' },
  { id: 'rl', label: 'Lunch', type: 'meal', mid: 'lunch', icon: '🥗' },
  { id: 'rd', label: 'Dinner', type: 'meal', mid: 'dinner', icon: '🍽️' },
];

export const CAT_ICONS = ['🥗','🍽️','☕','🍎','🥤','🍳','🥙','🍜','🧁','🍪','🥐','🍫','🍣','🥩','🫐','🥝'];
export const ROUTINE_ICONS = ['💧','☕','🥗','🍽️','🏃','💪','🧘','😴','💊','📖','🚶','🚴'];
