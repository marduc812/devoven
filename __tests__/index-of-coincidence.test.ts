import { indexOfCoincidence, formatIndexOfCoincidence } from '@/Components/Functions/IndexOfCoincidenceTools/logic';

describe('Index of Coincidence', () => {
  it('matches the published THE INDEX OF COINCIDENCE example', () => {
    const result = indexOfCoincidence('THE INDEX OF COINCIDENCE');
    expect(result.letters).toBe(21);
    expect(result.ic).toBeCloseTo(34 / 420, 12);
    expect(result.normalized).toBeCloseTo(26 * 34 / 420, 12);
  });
  it('counts only ASCII letters and folds their case', () => {
    expect(indexOfCoincidence('aA, bB 123 ßſé😀').letters).toBe(4);
    expect(indexOfCoincidence('aA, bB 123 ßſé😀').ic).toBeCloseTo(1 / 3);
  });
  it('distinguishes repeated and unique letters', () => {
    expect(indexOfCoincidence('AAAA').ic).toBe(1);
    expect(indexOfCoincidence('ABCDEFGHIJKLMNOPQRSTUVWXYZ').ic).toBe(0);
  });
  it.each(['', '123!', 'A'])('does not assign a probability to too few letters in %s', (text) => {
    expect(indexOfCoincidence(text).ic).toBeNull();
    expect(formatIndexOfCoincidence(text)).toContain('At least two A-Z letters are required.');
  });
  it('reports raw and normalized values separately', () => {
    expect(formatIndexOfCoincidence('AA')).toContain('Index of coincidence: 1.000000\nNormalized IC, multiplied by 26: 26.000000');
  });
});
