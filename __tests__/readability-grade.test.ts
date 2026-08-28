import {
  countSyllables,
  computeReadabilityScores,
  interpretFleschEase,
  interpretGrade,
  formatReadabilityOutput,
} from '@/Components/Functions/ReadabilityGradeTools/logic';

describe('countSyllables', () => {
  it('counts 1 syllable for "cat"', () => expect(countSyllables('cat')).toBe(1));
  it('counts 2 syllables for "happy"', () => expect(countSyllables('happy')).toBe(2));
  it('returns 0 for empty string', () => expect(countSyllables('')).toBe(0));
  it('counts at least 1 for any word', () => expect(countSyllables('rhythm')).toBeGreaterThanOrEqual(1));
});

describe('computeReadabilityScores', () => {
  const sample = 'The cat sat on the mat. It was a fat cat. The rat ran fast.';

  it('returns wordCount > 0', () => {
    expect(computeReadabilityScores(sample).wordCount).toBeGreaterThan(0);
  });

  it('returns sentenceCount = 3', () => {
    expect(computeReadabilityScores(sample).sentenceCount).toBe(3);
  });

  it('returns fleschReadingEase as a number', () => {
    const s = computeReadabilityScores(sample);
    expect(typeof s.fleschReadingEase).toBe('number');
  });

  it('returns all six scores', () => {
    const s = computeReadabilityScores(sample);
    expect(s.fleschKincaidGrade).toBeDefined();
    expect(s.gunningFog).toBeDefined();
    expect(s.smogIndex).toBeDefined();
    expect(s.colemanLiau).toBeDefined();
    expect(s.automatedReadabilityIndex).toBeDefined();
  });

  it('returns zeros for empty text', () => {
    const s = computeReadabilityScores('');
    expect(s.wordCount).toBe(0);
    expect(s.fleschReadingEase).toBe(0);
  });
});

describe('interpretFleschEase', () => {
  it('interprets high score as easy', () => expect(interpretFleschEase(90)).toContain('Very Easy'));
  it('interprets low score as difficult', () => expect(interpretFleschEase(20)).toContain('Difficult'));
});

describe('interpretGrade', () => {
  it('interprets grade 5 as elementary', () => expect(interpretGrade(5)).toContain('Elementary'));
  it('interprets grade 10 as high school', () => expect(interpretGrade(10)).toContain('High School'));
});

describe('formatReadabilityOutput', () => {
  it('returns prompt for empty input', () => {
    expect(formatReadabilityOutput('')).toContain('Enter text');
  });

  it('includes all metric names for valid text', () => {
    const out = formatReadabilityOutput('The cat sat on the mat. It was sunny. Dogs ran fast.');
    expect(out).toContain('Flesch Reading Ease');
    expect(out).toContain('Gunning Fog');
    expect(out).toContain('SMOG');
    expect(out).toContain('Coleman-Liau');
    expect(out).toContain('Automated Readability');
  });
});
