export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  cleaned = cleaned.replace(/^y/, '');
  const m = cleaned.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export function countLineSyllables(line: string): number {
  const words = line.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  return words.reduce(function(sum, w) { return sum + countSyllables(w); }, 0);
}

export interface HaikuLine {
  text: string;
  syllables: number;
  expected: number;
  valid: boolean;
}

export interface HaikuResult {
  lines: HaikuLine[];
  isValid: boolean;
  lineCount: number;
  totalSyllables: number;
}

const HAIKU_PATTERN = [5, 7, 5];

export function validateHaiku(input: string): HaikuResult {
  const rawLines = input.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });

  const lines: HaikuLine[] = rawLines.map(function(text, i) {
    const syllables = countLineSyllables(text);
    const expected = HAIKU_PATTERN[i] !== undefined ? HAIKU_PATTERN[i] : -1;
    return {
      text,
      syllables,
      expected,
      valid: expected !== -1 && syllables === expected,
    };
  });

  const isValid = lines.length === 3 && lines.every(function(l) { return l.valid; });
  const totalSyllables = lines.reduce(function(sum, l) { return sum + l.syllables; }, 0);

  return {
    lines,
    isValid,
    lineCount: lines.length,
    totalSyllables,
  };
}

// Themed word lists for haiku generation
const NATURE_WORDS: Record<string, string[]> = {
  spring: ['cherry blossoms fall', 'soft petals drift down', 'new green shoots arise', 'warm rain wakes the earth'],
  summer: ['cicadas singing', 'sunlight burns the stone', 'dragonfly hovers', 'heat shimmers on glass'],
  autumn: ['red leaves spiral down', 'geese cross empty skies', 'cool mist fills the vale', 'harvest moon rises'],
  winter: ['snow blurs the mountain', 'bare branches hold ice', 'frozen pond glitters', 'cold wind strips the bark'],
  rain: ['rain drums on the roof', 'puddles mirror clouds', 'thunder far away', 'wet leaves cling to stone'],
  moon: ['full moon on the lake', 'moonlight paints the road', 'crescent moon fades slow', 'pale moon hides in cloud'],
  mountain: ['mist clings to the peak', 'the mountain holds snow', 'stone path climbs toward sky', 'echo in the pass'],
  ocean: ['waves erase footprints', 'salt spray on the rocks', 'deep water is still', 'tide pulls back to sea'],
};

const FIVE_SYLLABLE_LINES = [
  'an old silent pond',
  'over the wintry',
  'the light of a lamp',
  'temple bells die out',
  'even in moonlight',
  'the short summer night',
  'in the autumn dusk',
  'a world of dew and',
  'spring passes away',
  'blossoms at daybreak',
];

const SEVEN_SYLLABLE_LINES = [
  'a frog jumps into the pond',
  'the sound of water fills the air',
  'silence is all that remains here',
  'the fragrance of distant flowers',
  'wind rustles through the bamboo grove',
  'shadows lengthen on the pathway',
  'moonlight rests upon the water',
  'the temple bell echoes away',
  'autumn grasses bend in the breeze',
  'fireflies drift along the river',
];

function pickFrom(arr: string[], seed: number): string {
  return arr[seed % arr.length];
}

export function generateHaiku(theme: string): string {
  const lower = theme.toLowerCase().replace(/[^a-z]/g, '');
  const seed = lower.split('').reduce(function(acc, ch) { return acc + ch.charCodeAt(0); }, 0);

  // Check if theme matches a known category
  let themeLines: string[] | null = null;
  for (const key of Object.keys(NATURE_WORDS)) {
    if (lower.includes(key) || key.includes(lower)) {
      themeLines = NATURE_WORDS[key];
      break;
    }
  }

  let line1: string;
  let line2: string;
  let line3: string;

  if (themeLines) {
    line1 = pickFrom(themeLines, seed);
    line2 = pickFrom(SEVEN_SYLLABLE_LINES, seed + 1);
    line3 = pickFrom(themeLines, seed + 2);
  } else {
    line1 = pickFrom(FIVE_SYLLABLE_LINES, seed);
    line2 = pickFrom(SEVEN_SYLLABLE_LINES, seed + 1);
    line3 = pickFrom(FIVE_SYLLABLE_LINES, seed + 3);
  }

  return line1 + '\n' + line2 + '\n' + line3;
}

export function formatHaikuOutput(input: string): string {
  if (!input.trim()) {
    return [
      'Enter a 3-line haiku to validate (5-7-5 syllable pattern).',
      '',
      'Or type a theme word on a single line to generate a haiku.',
      'Example themes: spring, summer, autumn, winter, rain, moon, mountain, ocean',
      '',
      'Format for validation:',
      'An old silent pond   (5 syllables)',
      'A frog jumps into the pond  (7 syllables)',
      'Splash, silence again  (5 syllables)',
    ].join('\n');
  }

  const lines = input.split('\n').filter(function(l) { return l.trim().length > 0; });

  // Single word — generate haiku
  if (lines.length === 1 && lines[0].trim().split(/\s+/).length === 1) {
    const theme = lines[0].trim();
    const generated = generateHaiku(theme);
    const result = validateHaiku(generated);
    return [
      `Generated haiku for theme: "${theme}"`,
      '',
      generated,
      '',
      '--- Syllable counts ---',
      ...result.lines.map(function(l) { return `"${l.text}" → ${l.syllables} syllables (expected ${l.expected})`; }),
      '',
      result.isValid ? 'Valid haiku!' : 'Note: Generated haiku may not be perfectly 5-7-5 due to syllable counting heuristics.',
    ].join('\n');
  }

  // Validate haiku
  const result = validateHaiku(input);
  const out: string[] = [];

  out.push('=== Haiku Validation (5-7-5 pattern) ===');
  out.push('');

  if (result.lineCount !== 3) {
    out.push(`Error: A haiku must have exactly 3 lines. Found ${result.lineCount} line(s).`);
    out.push('');
    out.push('Add or remove lines so there are exactly 3.');
    return out.join('\n');
  }

  for (let i = 0; i < result.lines.length; i++) {
    const l = result.lines[i];
    const marker = l.valid ? 'OK' : 'X';
    out.push(`Line ${i + 1}: "${l.text}"`);
    out.push(`  Syllables: ${l.syllables} / ${l.expected} expected  [${marker}]`);
    if (!l.valid) {
      const diff = l.syllables - l.expected;
      if (diff > 0) {
        out.push(`  Suggestion: Remove ${diff} syllable(s) — use shorter words or remove a word.`);
      } else {
        out.push(`  Suggestion: Add ${Math.abs(diff)} syllable(s) — use longer words or add a word.`);
      }
    }
    out.push('');
  }

  out.push(`Total syllables: ${result.totalSyllables} (expected: 17)`);
  out.push('');

  if (result.isValid) {
    out.push('This is a valid haiku! (5-7-5)');
  } else {
    out.push('Not a valid haiku yet — see suggestions above.');
  }

  return out.join('\n');
}
