import { countFrequency, formatFrequency, classifyChar, analyzeText } from '../Components/Functions/CharFrequencyTools/logic';

// ─── countFrequency ───────────────────────────────────────────────────────────

describe('countFrequency', () => {
  it('counts single character', () => {
    const result = countFrequency('aaa');
    expect(result).toHaveLength(1);
    expect(result[0].char).toBe('a');
    expect(result[0].count).toBe(3);
  });

  it('sorts by frequency descending', () => {
    const result = countFrequency('aaabbc');
    expect(result[0].char).toBe('a');
    expect(result[0].count).toBe(3);
    expect(result[1].char).toBe('b');
    expect(result[1].count).toBe(2);
  });

  it('calculates correct percentages', () => {
    const result = countFrequency('aabb');
    const a = result.find(e => e.char === 'a')!;
    const b = result.find(e => e.char === 'b')!;
    expect(a.percent).toBe(50);
    expect(b.percent).toBe(50);
  });

  it('includes spaces by default', () => {
    const result = countFrequency('a b');
    expect(result.some(e => e.char === ' ')).toBe(true);
  });

  it('excludes spaces when includeSpaces=false', () => {
    const result = countFrequency('a b', false);
    expect(result.some(e => e.char === ' ')).toBe(false);
  });

  it('returns empty array for empty input', () => {
    expect(countFrequency('')).toHaveLength(0);
  });

  it('handles special characters display names', () => {
    const result = countFrequency(' \n\t');
    const space = result.find(e => e.char === ' ')!;
    const newline = result.find(e => e.char === '\n')!;
    const tab = result.find(e => e.char === '\t')!;
    expect(space.display).toBe('SPACE');
    expect(newline.display).toBe('NEWLINE');
    expect(tab.display).toBe('TAB');
  });

  it('handles unicode characters', () => {
    const result = countFrequency('aé');
    expect(result).toHaveLength(2);
  });

  it('percentages sum to 100 for simple input', () => {
    const result = countFrequency('aabb');
    const total = result.reduce((sum, e) => sum + e.percent, 0);
    expect(total).toBeCloseTo(100, 1);
  });
});

// ─── formatFrequency ─────────────────────────────────────────────────────────

describe('formatFrequency', () => {
  it('returns no characters message for empty entries', () => {
    expect(formatFrequency([])).toBe('No characters found.');
  });

  it('includes header row', () => {
    const entries = countFrequency('hello');
    const result = formatFrequency(entries);
    expect(result).toContain('Char');
    expect(result).toContain('Count');
    expect(result).toContain('Percent');
  });

  it('includes separator line', () => {
    const entries = countFrequency('hello');
    const result = formatFrequency(entries);
    expect(result).toContain('---');
  });

  it('includes character counts', () => {
    const entries = countFrequency('aaa');
    const result = formatFrequency(entries);
    expect(result).toContain('3');
  });

  it('limits to 50 entries', () => {
    // Create a string with 60 unique chars
    const text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678';
    const entries = countFrequency(text);
    const result = formatFrequency(entries);
    const lines = result.split('\n');
    // header + separator + up to 50 rows
    expect(lines.length).toBeLessThanOrEqual(52);
  });

  it('shows SPACE for space character', () => {
    const entries = countFrequency('a b');
    const result = formatFrequency(entries);
    expect(result).toContain('SPACE');
  });
});

// ─── classifyChar ────────────────────────────────────────────────────────────

describe('classifyChar', () => {
  it('classifies latin letters', () => expect(classifyChar('a')).toBe('letter'));
  it('classifies accented letters as letters', () => expect(classifyChar('é')).toBe('letter'));
  it('classifies greek letters as letters', () => expect(classifyChar('π')).toBe('letter'));
  it('classifies digits', () => expect(classifyChar('7')).toBe('digit'));
  it('classifies spaces as whitespace', () => expect(classifyChar(' ')).toBe('whitespace'));
  it('classifies newlines as whitespace', () => expect(classifyChar('\n')).toBe('whitespace'));
  it('classifies punctuation', () => expect(classifyChar('!')).toBe('punctuation'));
  it('classifies symbols as punctuation', () => expect(classifyChar('+')).toBe('punctuation'));
  it('classifies emoji as other', () => expect(classifyChar('🙂')).toBe('other'));
});

// ─── analyzeText ─────────────────────────────────────────────────────────────

describe('analyzeText', () => {
  it('counts totals and distinct characters', () => {
    const r = analyzeText('aabbc');
    expect(r.total).toBe(5);
    expect(r.unique).toBe(3);
  });

  it('keeps case apart by default', () => {
    const r = analyzeText('aA');
    expect(r.unique).toBe(2);
  });

  it('folds case when asked', () => {
    const r = analyzeText('aA', { ignoreCase: true });
    expect(r.unique).toBe(1);
    expect(r.entries[0].count).toBe(2);
  });

  it('drops whitespace when asked', () => {
    const r = analyzeText('a b\nc', { ignoreWhitespace: true });
    expect(r.total).toBe(3);
    expect(r.entries.some(e => /\s/.test(e.char))).toBe(false);
  });

  it('splits counts across character classes', () => {
    const r = analyzeText('ab1 !');
    const byName = Object.fromEntries(r.categories.map(c => [c.name, c.count]));
    expect(byName.letter).toBe(2);
    expect(byName.digit).toBe(1);
    expect(byName.whitespace).toBe(1);
    expect(byName.punctuation).toBe(1);
  });

  it('omits classes that never appear', () => {
    const r = analyzeText('abc');
    expect(r.categories.map(c => c.name)).toEqual(['letter']);
  });

  it('category percentages sum to 100', () => {
    const r = analyzeText('Hello, world! 42');
    const sum = r.categories.reduce((acc, c) => acc + c.percent, 0);
    expect(sum).toBeCloseTo(100, 6);
  });

  it('always reports all 26 letters, zeros included', () => {
    const r = analyzeText('abc');
    expect(r.letters).toHaveLength(26);
    expect(r.letters.find(l => l.letter === 'Z')!.count).toBe(0);
  });

  it('folds case in the A-Z map even when the table does not', () => {
    const r = analyzeText('aA');
    expect(r.letters.find(l => l.letter === 'A')!.count).toBe(2);
  });

  it('scales the A-Z map against letters only, not the whole text', () => {
    const r = analyzeText('ab!!!!');
    expect(r.letters.find(l => l.letter === 'A')!.percent).toBeCloseTo(50, 6);
  });

  it('handles text with no letters at all', () => {
    const r = analyzeText('123');
    expect(r.letters.every(l => l.count === 0 && l.percent === 0)).toBe(true);
  });

  it('returns empty analysis for empty input', () => {
    const r = analyzeText('');
    expect(r.total).toBe(0);
    expect(r.unique).toBe(0);
    expect(r.categories).toHaveLength(0);
  });
});
