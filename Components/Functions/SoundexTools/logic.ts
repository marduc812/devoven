const SOUNDEX_MAP: Record<string, string> = {
  BFPV: '1', CGJKQSXYZ: '2', DT: '3', L: '4', MN: '5', R: '6'
};

function getSoundexCode(ch: string): string {
  const upper = ch.toUpperCase();
  for (const [group, code] of Object.entries(SOUNDEX_MAP)) {
    if (group.includes(upper)) return code;
  }
  return '0';
}

export function soundex(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z]/g, '');
  if (cleaned.length === 0) throw new Error('Input must contain at least one letter');

  const first = cleaned[0].toUpperCase();
  let code = first;
  let prev = getSoundexCode(first);

  for (let i = 1; i < cleaned.length && code.length < 4; i++) {
    const curr = getSoundexCode(cleaned[i]);
    if (curr !== '0' && curr !== prev) {
      code += curr;
    }
    // HW are ignored but don't reset prev
    if (!('HW'.includes(cleaned[i].toUpperCase()))) {
      prev = curr;
    }
  }

  return code.padEnd(4, '0');
}

/** Letter groups in the order the encoder checks them, for the UI legend. */
export const SOUNDEX_GROUPS: { digit: string; letters: string }[] = [
  { digit: '1', letters: 'B F P V' },
  { digit: '2', letters: 'C G J K Q S X Y Z' },
  { digit: '3', letters: 'D T' },
  { digit: '4', letters: 'L' },
  { digit: '5', letters: 'M N' },
  { digit: '6', letters: 'R' },
  { digit: '0', letters: 'A E I O U H W' },
];

export type TraceStatus = 'first' | 'coded' | 'ignored' | 'dropped' | 'truncated';

export interface TraceStep {
  letter: string;
  /** Soundex digit the letter maps to; '0' means it carries no code. */
  digit: string;
  status: TraceStatus;
  /** Short reason shown under the letter. */
  note: string;
}

export interface SoundexEntry {
  name: string;
  code: string;
  error: string | null;
  trace: TraceStep[];
}

/** Re-runs the encoder step by step so the UI can show why each letter mattered. */
export function soundexTrace(name: string): TraceStep[] {
  const cleaned = name.replace(/[^a-zA-Z]/g, '');
  if (cleaned.length === 0) return [];

  const first = cleaned[0].toUpperCase();
  const steps: TraceStep[] = [
    { letter: first, digit: getSoundexCode(first), status: 'first', note: 'kept as letter' },
  ];
  let codeLength = 1;
  let prev = getSoundexCode(first);

  for (let i = 1; i < cleaned.length; i++) {
    const letter = cleaned[i].toUpperCase();
    const curr = getSoundexCode(letter);

    if (codeLength >= 4) {
      steps.push({ letter, digit: curr, status: 'truncated', note: 'past 4 chars' });
      continue;
    }

    if (curr === '0') {
      steps.push({
        letter,
        digit: curr,
        status: 'ignored',
        note: 'HW'.includes(letter) ? 'skipped, keeps run' : 'vowel, breaks run',
      });
    } else if (curr === prev) {
      steps.push({ letter, digit: curr, status: 'dropped', note: `repeat of ${curr}` });
    } else {
      steps.push({ letter, digit: curr, status: 'coded', note: `adds ${curr}` });
      codeLength++;
    }

    if (!'HW'.includes(letter)) prev = curr;
  }

  return steps;
}

/** Encode every non-empty line, keeping per-name errors instead of throwing. */
export function soundexEntries(input: string): SoundexEntry[] {
  return input
    .split('\n')
    .map(n => n.trim())
    .filter(n => n)
    .map(name => {
      try {
        return { name, code: soundex(name), error: null, trace: soundexTrace(name) };
      } catch (e) {
        return { name, code: '', error: e instanceof Error ? e.message : 'Invalid name', trace: [] };
      }
    });
}

export function soundexBatch(input: string): string {
  const names = input.split('\n').map(n => n.trim()).filter(n => n);
  if (names.length === 0) throw new Error('Enter names (one per line)');
  return names.map(name => {
    try {
      return `${name.padEnd(20)} → ${soundex(name)}`;
    } catch {
      return `${name.padEnd(20)} → (error)`;
    }
  }).join('\n');
}
