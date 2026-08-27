import { analyzeSequence } from '@/Components/Functions/SequenceRecognizerTools/logic';

describe('analyzeSequence', () => {
  it('returns null for empty input', () => expect(analyzeSequence('')).toBeNull());
  it('returns null for invalid input', () => expect(analyzeSequence('a, b, c')).toBeNull());
  it('returns null for single term', () => expect(analyzeSequence('5')).toBeNull());

  describe('Arithmetic Progression', () => {
    it('detects AP: 2, 4, 6, 8', () => {
      const r = analyzeSequence('2, 4, 6, 8')!;
      expect(r.primaryPattern).not.toBeNull();
      expect(r.primaryPattern!.name).toBe('Arithmetic Progression');
      expect(r.primaryPattern!.nextTerms[0]).toBe(10);
    });
    it('detects AP with negative difference', () => {
      const r = analyzeSequence('10, 7, 4, 1')!;
      expect(r.primaryPattern!.name).toBe('Arithmetic Progression');
      expect(r.primaryPattern!.nextTerms[0]).toBe(-2);
    });
  });

  describe('Geometric Progression', () => {
    it('detects GP: 1, 2, 4, 8', () => {
      const r = analyzeSequence('1, 2, 4, 8')!;
      const match = r.patterns.find(p => p.name === 'Geometric Progression');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(16);
    });
    it('detects GP: 3, 9, 27, 81', () => {
      const r = analyzeSequence('3, 9, 27, 81')!;
      const match = r.patterns.find(p => p.name === 'Geometric Progression');
      expect(match).toBeDefined();
    });
  });

  describe('Fibonacci-like', () => {
    it('detects Fibonacci: 1, 1, 2, 3, 5, 8', () => {
      const r = analyzeSequence('1, 1, 2, 3, 5, 8')!;
      const match = r.patterns.find(p => p.name === 'Fibonacci-like');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(13);
    });
    it('detects Lucas: 2, 1, 3, 4, 7', () => {
      const r = analyzeSequence('2, 1, 3, 4, 7')!;
      const match = r.patterns.find(p => p.name === 'Fibonacci-like');
      expect(match).toBeDefined();
    });
  });

  describe('Perfect Squares', () => {
    it('detects 1, 4, 9, 16, 25', () => {
      const r = analyzeSequence('1, 4, 9, 16, 25')!;
      const match = r.patterns.find(p => p.name === 'Perfect Squares');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(36);
    });
  });

  describe('Perfect Cubes', () => {
    it('detects 1, 8, 27, 64', () => {
      const r = analyzeSequence('1, 8, 27, 64')!;
      const match = r.patterns.find(p => p.name === 'Perfect Cubes');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(125);
    });
  });

  describe('Triangular Numbers', () => {
    it('detects 1, 3, 6, 10, 15', () => {
      const r = analyzeSequence('1, 3, 6, 10, 15')!;
      const match = r.patterns.find(p => p.name === 'Triangular Numbers');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(21);
    });
  });

  describe('Powers of 2', () => {
    it('detects 2, 4, 8, 16', () => {
      const r = analyzeSequence('2, 4, 8, 16')!;
      const match = r.patterns.find(p => p.name === 'Powers of 2');
      expect(match).toBeDefined();
      expect(match!.nextTerms[0]).toBe(32);
    });
  });

  describe('parsed terms', () => {
    it('parses space-separated input', () => {
      const r = analyzeSequence('1 2 3 4 5')!;
      expect(r.terms).toEqual([1, 2, 3, 4, 5]);
    });
    it('parses comma-separated input', () => {
      const r = analyzeSequence('10,20,30')!;
      expect(r.terms).toEqual([10, 20, 30]);
    });
  });
});
