// Keyboard Layout Analyzer - logic.ts
// All computation is pure TypeScript, no browser APIs.

export type FingerName = 'pinky' | 'ring' | 'middle' | 'index';
export type HandName = 'left' | 'right';

export interface FingerDistribution {
  left: Record<FingerName, number>;
  right: Record<FingerName, number>;
}

export interface LayoutAnalysis {
  layout: string;
  homeRowPercent: number;
  sfbCount: number; // same-finger bigrams
  handAlternationRate: number; // percent of consecutive keys on alternating hands
  fingerDistribution: FingerDistribution;
  totalChars: number;
}

export interface KeyInfo {
  hand: HandName;
  finger: FingerName;
  isHomeRow: boolean;
}

// QWERTY layout key mappings
const QWERTY_MAP: Record<string, KeyInfo> = {
  q: { hand: 'left', finger: 'pinky', isHomeRow: false },
  w: { hand: 'left', finger: 'ring', isHomeRow: false },
  e: { hand: 'left', finger: 'middle', isHomeRow: false },
  r: { hand: 'left', finger: 'index', isHomeRow: false },
  t: { hand: 'left', finger: 'index', isHomeRow: false },
  y: { hand: 'right', finger: 'index', isHomeRow: false },
  u: { hand: 'right', finger: 'index', isHomeRow: false },
  i: { hand: 'right', finger: 'middle', isHomeRow: false },
  o: { hand: 'right', finger: 'ring', isHomeRow: false },
  p: { hand: 'right', finger: 'pinky', isHomeRow: false },
  a: { hand: 'left', finger: 'pinky', isHomeRow: true },
  s: { hand: 'left', finger: 'ring', isHomeRow: true },
  d: { hand: 'left', finger: 'middle', isHomeRow: true },
  f: { hand: 'left', finger: 'index', isHomeRow: true },
  g: { hand: 'left', finger: 'index', isHomeRow: true },
  h: { hand: 'right', finger: 'index', isHomeRow: true },
  j: { hand: 'right', finger: 'index', isHomeRow: true },
  k: { hand: 'right', finger: 'middle', isHomeRow: true },
  l: { hand: 'right', finger: 'ring', isHomeRow: true },
  z: { hand: 'left', finger: 'pinky', isHomeRow: false },
  x: { hand: 'left', finger: 'ring', isHomeRow: false },
  c: { hand: 'left', finger: 'middle', isHomeRow: false },
  v: { hand: 'left', finger: 'index', isHomeRow: false },
  b: { hand: 'left', finger: 'index', isHomeRow: false },
  n: { hand: 'right', finger: 'index', isHomeRow: false },
  m: { hand: 'right', finger: 'index', isHomeRow: false },
};

// Dvorak layout key mappings
const DVORAK_MAP: Record<string, KeyInfo> = {
  // top row
  p: { hand: 'left', finger: 'pinky', isHomeRow: false },
  y: { hand: 'left', finger: 'ring', isHomeRow: false },
  f: { hand: 'left', finger: 'middle', isHomeRow: false },
  g: { hand: 'left', finger: 'index', isHomeRow: false },
  c: { hand: 'left', finger: 'index', isHomeRow: false },
  r: { hand: 'right', finger: 'index', isHomeRow: false },
  l: { hand: 'right', finger: 'index', isHomeRow: false },
  // home row
  a: { hand: 'left', finger: 'pinky', isHomeRow: true },
  o: { hand: 'left', finger: 'ring', isHomeRow: true },
  e: { hand: 'left', finger: 'middle', isHomeRow: true },
  u: { hand: 'left', finger: 'index', isHomeRow: true },
  i: { hand: 'left', finger: 'index', isHomeRow: true },
  d: { hand: 'right', finger: 'index', isHomeRow: true },
  h: { hand: 'right', finger: 'index', isHomeRow: true },
  t: { hand: 'right', finger: 'middle', isHomeRow: true },
  n: { hand: 'right', finger: 'ring', isHomeRow: true },
  s: { hand: 'right', finger: 'pinky', isHomeRow: true },
  // bottom row
  q: { hand: 'left', finger: 'pinky', isHomeRow: false },
  j: { hand: 'left', finger: 'ring', isHomeRow: false },
  k: { hand: 'left', finger: 'middle', isHomeRow: false },
  x: { hand: 'left', finger: 'index', isHomeRow: false },
  b: { hand: 'left', finger: 'index', isHomeRow: false },
  m: { hand: 'right', finger: 'index', isHomeRow: false },
  w: { hand: 'right', finger: 'index', isHomeRow: false },
  v: { hand: 'right', finger: 'middle', isHomeRow: false },
  z: { hand: 'right', finger: 'ring', isHomeRow: false },
};

// Colemak layout key mappings
const COLEMAK_MAP: Record<string, KeyInfo> = {
  // top row (same as QWERTY except r,s,t,d,n,e,i,o)
  q: { hand: 'left', finger: 'pinky', isHomeRow: false },
  w: { hand: 'left', finger: 'ring', isHomeRow: false },
  f: { hand: 'left', finger: 'middle', isHomeRow: false },
  p: { hand: 'left', finger: 'index', isHomeRow: false },
  g: { hand: 'left', finger: 'index', isHomeRow: false },
  j: { hand: 'right', finger: 'index', isHomeRow: false },
  l: { hand: 'right', finger: 'index', isHomeRow: false },
  u: { hand: 'right', finger: 'middle', isHomeRow: false },
  y: { hand: 'right', finger: 'ring', isHomeRow: false },
  // home row
  a: { hand: 'left', finger: 'pinky', isHomeRow: true },
  r: { hand: 'left', finger: 'ring', isHomeRow: true },
  s: { hand: 'left', finger: 'middle', isHomeRow: true },
  t: { hand: 'left', finger: 'index', isHomeRow: true },
  d: { hand: 'left', finger: 'index', isHomeRow: true },
  h: { hand: 'right', finger: 'index', isHomeRow: true },
  n: { hand: 'right', finger: 'index', isHomeRow: true },
  e: { hand: 'right', finger: 'middle', isHomeRow: true },
  i: { hand: 'right', finger: 'ring', isHomeRow: true },
  o: { hand: 'right', finger: 'pinky', isHomeRow: true },
  // bottom row
  z: { hand: 'left', finger: 'pinky', isHomeRow: false },
  x: { hand: 'left', finger: 'ring', isHomeRow: false },
  c: { hand: 'left', finger: 'middle', isHomeRow: false },
  v: { hand: 'left', finger: 'index', isHomeRow: false },
  b: { hand: 'left', finger: 'index', isHomeRow: false },
  k: { hand: 'right', finger: 'index', isHomeRow: false },
  m: { hand: 'right', finger: 'index', isHomeRow: false },
};

export const LAYOUTS: Record<string, Record<string, KeyInfo>> = {
  QWERTY: QWERTY_MAP,
  Dvorak: DVORAK_MAP,
  Colemak: COLEMAK_MAP,
};

export function analyzeLayout(text: string, layoutName: string): LayoutAnalysis {
  const map = LAYOUTS[layoutName];
  if (!map) throw new Error('Unknown layout: ' + layoutName);

  const chars = text.toLowerCase().replace(/[^a-z]/g, '').split('');
  const totalChars = chars.length;

  const dist: FingerDistribution = {
    left: { pinky: 0, ring: 0, middle: 0, index: 0 },
    right: { pinky: 0, ring: 0, middle: 0, index: 0 },
  };

  let homeRowCount = 0;
  let sfbCount = 0;
  let handAlternations = 0;

  const keyInfos: Array<KeyInfo | null> = chars.map(c => map[c] || null);

  for (let i = 0; i < keyInfos.length; i++) {
    const ki = keyInfos[i];
    if (!ki) continue;
    dist[ki.hand][ki.finger]++;
    if (ki.isHomeRow) homeRowCount++;

    if (i > 0) {
      const prev = keyInfos[i - 1];
      if (prev) {
        if (prev.hand === ki.hand && prev.finger === ki.finger) sfbCount++;
        if (prev.hand !== ki.hand) handAlternations++;
      }
    }
  }

  const validChars = keyInfos.filter(k => k !== null).length;
  const bigramCount = validChars > 1 ? validChars - 1 : 1;

  return {
    layout: layoutName,
    homeRowPercent: validChars > 0 ? Math.round((homeRowCount / validChars) * 100) : 0,
    sfbCount,
    handAlternationRate: validChars > 1 ? Math.round((handAlternations / bigramCount) * 100) : 0,
    fingerDistribution: dist,
    totalChars: validChars,
  };
}

/** One physical keyboard row, split at the hand gap. '' marks a non-letter key. */
export interface LayoutRow {
  left: string[];
  right: string[];
}

/**
 * Physical key positions per layout, top row first. Needed to draw a keyboard —
 * LAYOUTS only records which finger presses each key, not where the key sits.
 */
export const LAYOUT_ROWS: Record<string, LayoutRow[]> = {
  QWERTY: [
    { left: ['q', 'w', 'e', 'r', 't'], right: ['y', 'u', 'i', 'o', 'p'] },
    { left: ['a', 's', 'd', 'f', 'g'], right: ['h', 'j', 'k', 'l'] },
    { left: ['z', 'x', 'c', 'v', 'b'], right: ['n', 'm'] },
  ],
  Dvorak: [
    { left: ['', '', '', 'p', 'y'], right: ['f', 'g', 'c', 'r', 'l'] },
    { left: ['a', 'o', 'e', 'u', 'i'], right: ['d', 'h', 't', 'n', 's'] },
    { left: ['', 'q', 'j', 'k', 'x'], right: ['b', 'm', 'w', 'v', 'z'] },
  ],
  Colemak: [
    { left: ['q', 'w', 'f', 'p', 'g'], right: ['j', 'l', 'u', 'y'] },
    { left: ['a', 'r', 's', 't', 'd'], right: ['h', 'n', 'e', 'i', 'o'] },
    { left: ['z', 'x', 'c', 'v', 'b'], right: ['k', 'm'] },
  ],
};

/** How often each a–z letter appears, for heat-colouring the key grid. */
export function letterFrequency(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const ch of text.toLowerCase().replace(/[^a-z]/g, '')) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  return freq;
}

/**
 * Higher is better: rewards home-row usage and hand alternation, penalises
 * same-finger bigrams. Same formula the text report used for its recommendation.
 */
export function scoreLayout(a: LayoutAnalysis): number {
  return a.homeRowPercent - a.sfbCount + a.handAlternationRate;
}

/** The highest-scoring layout for this text. Ties keep the earlier layout. */
export function bestLayout(analyses: LayoutAnalysis[]): LayoutAnalysis {
  if (analyses.length === 0) throw new Error('No layouts to compare');
  return analyses.reduce((a, b) => (scoreLayout(a) >= scoreLayout(b) ? a : b));
}
