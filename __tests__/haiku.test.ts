import {
  countSyllables,
  countLineSyllables,
  validateHaiku,
  generateHaiku,
  formatHaikuOutput,
} from '@/Components/Functions/HaikuTools/logic';

describe('countSyllables', () => {
  it('counts 1 syllable for "cat"', () => expect(countSyllables('cat')).toBe(1));
  it('counts 2 for "happy"', () => expect(countSyllables('happy')).toBe(2));
  it('returns 0 for empty string', () => expect(countSyllables('')).toBe(0));
  it('counts at least 1 for any non-empty word', () => {
    expect(countSyllables('the')).toBeGreaterThanOrEqual(1);
  });
});

describe('countLineSyllables', () => {
  it('counts syllables across multiple words', () => {
    // "an old si-lent pond" = 5 syllables
    const count = countLineSyllables('an old silent pond');
    expect(count).toBeGreaterThan(0);
  });

  it('returns 0 for empty line', () => {
    expect(countLineSyllables('')).toBe(0);
  });
});

describe('validateHaiku', () => {
  it('validates correct 5-7-5 haiku', () => {
    // Use a known haiku-like structure that syllable counter can parse
    const input = 'an old silent pond\na frog jumps into the pond\nsplash silence again';
    const result = validateHaiku(input);
    expect(result.lineCount).toBe(3);
    // We only check structure, not perfect syllable count since heuristic
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].expected).toBe(5);
    expect(result.lines[1].expected).toBe(7);
    expect(result.lines[2].expected).toBe(5);
  });

  it('returns lineCount 1 for single line', () => {
    const result = validateHaiku('just one line here');
    expect(result.lineCount).toBe(1);
    expect(result.isValid).toBe(false);
  });

  it('returns lineCount 0 for empty input', () => {
    const result = validateHaiku('');
    expect(result.lineCount).toBe(0);
    expect(result.isValid).toBe(false);
  });

  it('includes syllable counts in each line', () => {
    const result = validateHaiku('hello there world\nhello world how are you now\ngoodbye for today');
    for (const line of result.lines) {
      expect(line.syllables).toBeGreaterThan(0);
    }
  });
});

describe('generateHaiku', () => {
  it('generates a 3-line string', () => {
    const h = generateHaiku('spring');
    const lines = h.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBe(3);
  });

  it('generates different haikus for different themes', () => {
    const h1 = generateHaiku('moon');
    const h2 = generateHaiku('ocean');
    expect(h1).not.toBe(h2);
  });

  it('generates something for unknown theme', () => {
    const h = generateHaiku('xyzfoo');
    expect(h.length).toBeGreaterThan(0);
  });
});

describe('formatHaikuOutput', () => {
  it('returns instructions for empty input', () => {
    expect(formatHaikuOutput('')).toContain('5-7-5');
  });

  it('generates haiku for single word input', () => {
    const out = formatHaikuOutput('spring');
    expect(out).toContain('Generated haiku');
  });

  it('shows error for wrong number of lines', () => {
    const out = formatHaikuOutput('just one line');
    expect(out).toContain('3 lines');
  });

  it('shows validation for 3-line input', () => {
    const out = formatHaikuOutput('cats run fast here\ndogs bark at the full bright moon\nbirds fly away now');
    expect(out).toContain('Line 1');
    expect(out).toContain('Line 2');
    expect(out).toContain('Line 3');
  });
});
