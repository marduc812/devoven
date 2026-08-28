import {
  parseConstraints,
  filterWords,
  scoreWordFreq,
  formatWordleSolver,
  WORD_LIST,
} from '@/Components/Functions/WordleSolverTools/logic';

describe('WORD_LIST', () => {
  it('contains at least 500 words', () => {
    const fiveLetterWords = WORD_LIST.filter(w => w.replace(/[^a-zA-Z]/g, '').length === 5);
    expect(fiveLetterWords.length).toBeGreaterThanOrEqual(500);
  });
  it('contains common words', () => {
    expect(WORD_LIST).toContain('about');
    expect(WORD_LIST).toContain('world');
    expect(WORD_LIST).toContain('table');
  });
});

describe('parseConstraints', () => {
  it('parses green pattern', () => {
    const c = parseConstraints('green: .A.LE');
    expect(c.greenPattern).toBe('.A.LE');
  });
  it('parses yellow letters', () => {
    const c = parseConstraints('yellow: T,R');
    expect(c.yellowLetters).toContain('t');
    expect(c.yellowLetters).toContain('r');
  });
  it('parses gray letters', () => {
    const c = parseConstraints('gray: S,N,D');
    expect(c.grayLetters).toContain('s');
    expect(c.grayLetters).toContain('n');
    expect(c.grayLetters).toContain('d');
  });
  it('defaults to all-unknown green pattern', () => {
    const c = parseConstraints('yellow: a');
    expect(c.greenPattern).toBe('.....');
  });
  it('parses underscore as dot in green', () => {
    const c = parseConstraints('green: _A_LE');
    expect(c.greenPattern).toBe('.A.LE');
  });
  it('handles multi-line input', () => {
    const c = parseConstraints('green: .A.LE\nyellow: T\ngray: S,N');
    expect(c.greenPattern).toBe('.A.LE');
    expect(c.yellowLetters).toContain('t');
    expect(c.grayLetters).toContain('s');
  });
});

describe('filterWords', () => {
  it('returns all 5-letter words with no constraints', () => {
    const c = parseConstraints('');
    const result = filterWords(c, WORD_LIST);
    expect(result.length).toBeGreaterThan(0);
  });
  it('filters by green position', () => {
    const c = parseConstraints('green: t....');
    const result = filterWords(c, WORD_LIST);
    for (const w of result) {
      expect(w[0].toLowerCase()).toBe('t');
    }
  });
  it('filters out gray letters', () => {
    const c = parseConstraints('gray: x,z,q,j,k,v,w,y,b,f,g,h');
    const result = filterWords(c, WORD_LIST);
    for (const w of result) {
      expect(w.toLowerCase()).not.toMatch(/[xzqjkvwybfgh]/);
    }
  });
  it('requires yellow letters to be present', () => {
    const c = parseConstraints('yellow: a');
    const result = filterWords(c, WORD_LIST);
    for (const w of result) {
      expect(w.toLowerCase()).toContain('a');
    }
  });
  it('returns empty array when constraints eliminate all words', () => {
    const c = parseConstraints('green: ZZZZZ');
    const result = filterWords(c, ['about', 'world', 'table']);
    expect(result.length).toBe(0);
  });
});

describe('scoreWordFreq', () => {
  it('returns positive score for common letters', () => {
    expect(scoreWordFreq('aeiou')).toBeGreaterThan(0);
  });
  it('returns lower score for rare letters', () => {
    const rare = scoreWordFreq('jqxzv');
    const common = scoreWordFreq('earst');
    expect(common).toBeGreaterThan(rare);
  });
  it('does not double-count repeated letters', () => {
    const single = scoreWordFreq('a');
    const repeated = scoreWordFreq('aaaaa');
    expect(single).toBe(repeated);
  });
});

describe('formatWordleSolver', () => {
  it('returns empty for empty input', () => {
    expect(formatWordleSolver('')).toBe('');
    expect(formatWordleSolver('   ')).toBe('');
  });
  it('shows possible words count', () => {
    const result = formatWordleSolver('gray: z,x,q,j');
    expect(result).toContain('Possible words:');
  });
  it('shows constraints parsed section', () => {
    const result = formatWordleSolver('green: .a...\nyellow: t\ngray: s');
    expect(result).toContain('Constraints parsed:');
    expect(result).toContain('Green pattern:');
  });
  it('shows usage instructions', () => {
    const result = formatWordleSolver('green: .....');
    expect(result).toContain('How to use:');
  });
  it('shows no matches message when constrained heavily', () => {
    const result = formatWordleSolver('green: ZZZZZ');
    expect(result).toContain('No matches found');
  });
});
