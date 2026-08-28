import { countSyllables, fleschKincaidGrade, fleschReadingEase, gradeDescription, analyzeText } from '../Components/Functions/ReadabilityTools/logic';

describe('countSyllables', () => {
  it('single syllable words', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('dog')).toBe(1);
    expect(countSyllables('the')).toBe(1);
  });

  it('two syllable words', () => {
    expect(countSyllables('happy')).toBeGreaterThanOrEqual(2);
    expect(countSyllables('table')).toBeGreaterThanOrEqual(1);
  });

  it('empty string returns 0', () => {
    expect(countSyllables('')).toBe(0);
  });

  it('non-alpha characters are stripped', () => {
    expect(countSyllables('cat!')).toBe(countSyllables('cat'));
  });

  it('returns at least 1 for any non-empty word', () => {
    expect(countSyllables('xyz')).toBeGreaterThanOrEqual(1);
  });
});

describe('fleschKincaidGrade', () => {
  it('returns 0 for empty string', () => {
    expect(fleschKincaidGrade('')).toBe(0);
  });

  it('returns a number', () => {
    const grade = fleschKincaidGrade('The cat sat on the mat. It was a nice day.');
    expect(typeof grade).toBe('number');
    expect(isNaN(grade)).toBe(false);
  });

  it('complex text gets higher grade than simple text', () => {
    const simple = 'The cat sat. The dog ran. It was fun.';
    const complex = 'The implementation of sophisticated algorithms necessitates comprehensive understanding. Complex computational methodologies facilitate advanced problem resolution.';
    expect(fleschKincaidGrade(complex)).toBeGreaterThan(fleschKincaidGrade(simple));
  });
});

describe('fleschReadingEase', () => {
  it('returns 0 for empty string', () => {
    expect(fleschReadingEase('')).toBe(0);
  });

  it('returns a number', () => {
    const score = fleschReadingEase('The cat sat on the mat. It was fun.');
    expect(typeof score).toBe('number');
    expect(isNaN(score)).toBe(false);
  });

  it('simple text scores higher ease than complex text', () => {
    const simple = 'The cat sat. It was fun. I like cats.';
    const complex = 'The implementation of sophisticated algorithms necessitates comprehensive understanding. Complex computational methodologies facilitate advanced problem resolution.';
    expect(fleschReadingEase(simple)).toBeGreaterThan(fleschReadingEase(complex));
  });
});

describe('gradeDescription', () => {
  it('returns Very Easy for grade < 6', () => {
    expect(gradeDescription(4)).toContain('Very Easy');
  });

  it('returns Easy for grade 6-8', () => {
    expect(gradeDescription(7)).toContain('Easy');
  });

  it('returns Difficult for grade 12-14', () => {
    expect(gradeDescription(13)).toContain('Difficult');
  });

  it('returns Very Difficult for high grade', () => {
    expect(gradeDescription(16)).toContain('Very Difficult');
  });
});

describe('analyzeText', () => {
  it('returns prompt for empty input', () => {
    expect(analyzeText('')).toContain('Enter text');
  });

  it('returns prompt for whitespace-only input', () => {
    expect(analyzeText('   ')).toContain('Enter text');
  });

  it('includes word count', () => {
    const result = analyzeText('Hello world foo bar baz');
    expect(result).toContain('Words:');
    expect(result).toContain('5');
  });

  it('includes Flesch-Kincaid Grade', () => {
    const result = analyzeText('The cat sat on the mat. It was a nice day.');
    expect(result).toContain('Flesch-Kincaid Grade');
  });

  it('includes Reading Level description', () => {
    const result = analyzeText('The cat sat on the mat. It was a nice day.');
    expect(result).toContain('Reading Level');
  });

  it('includes Flesch Reading Ease', () => {
    const result = analyzeText('The cat sat on the mat. It was a nice day.');
    expect(result).toContain('Flesch Reading Ease');
  });

  it('includes top words', () => {
    const result = analyzeText('hello world hello world hello world hello world hello');
    expect(result).toContain('Top words');
  });
});
