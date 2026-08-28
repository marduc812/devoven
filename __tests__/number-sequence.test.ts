import { generateSequence, processInput } from '@/Components/Functions/NumberSequenceTools/logic';

describe('generateSequence - fibonacci', () => {
  it('generates first 10 Fibonacci numbers', () => {
    const result = generateSequence('fibonacci 10');
    expect(result.sequence[0]).toBe('0');
    expect(result.sequence[1]).toBe('1');
    expect(result.sequence[6]).toBe('8');
    expect(result.sequence).toHaveLength(10);
  });

  it('accepts fib alias', () => {
    const result = generateSequence('fib 5');
    expect(result.sequence).toHaveLength(5);
  });

  it('throws for count > 200', () => {
    expect(() => generateSequence('fibonacci 201')).toThrow();
  });
});

describe('generateSequence - primes', () => {
  it('generates first 5 primes', () => {
    const result = generateSequence('primes 5');
    expect(result.sequence).toEqual(['2', '3', '5', '7', '11']);
  });

  it('throws for count > 1000', () => {
    expect(() => generateSequence('primes 1001')).toThrow();
  });
});

describe('generateSequence - squares', () => {
  it('generates square numbers', () => {
    const result = generateSequence('squares 5');
    expect(result.sequence).toEqual(['0', '1', '4', '9', '16']);
  });
});

describe('generateSequence - triangular', () => {
  it('generates triangular numbers', () => {
    const result = generateSequence('triangular 5');
    expect(result.sequence).toEqual(['0', '1', '3', '6', '10']);
  });
});

describe('generateSequence - arithmetic', () => {
  it('generates arithmetic sequence', () => {
    const result = generateSequence('arithmetic 3 7 4');
    expect(result.sequence).toEqual(['3', '10', '17', '24']);
  });
});

describe('generateSequence - geometric', () => {
  it('generates geometric sequence', () => {
    const result = generateSequence('geometric 1 2 5');
    expect(result.sequence).toEqual(['1', '2', '4', '8', '16']);
  });

  it('throws for ratio 0', () => {
    expect(() => generateSequence('geometric 1 0 5')).toThrow();
  });
});

describe('generateSequence - powers', () => {
  it('generates powers of 2', () => {
    const result = generateSequence('powers 2 5');
    expect(result.sequence).toEqual(['1', '2', '4', '8', '16']);
  });
});

describe('processInput', () => {
  it('returns empty for empty input', () => {
    expect(processInput('')).toBe('');
  });

  it('returns error string for unknown command', () => {
    const out = processInput('unknowncmd 5');
    expect(out).toContain('Error');
  });

  it('formats output with title', () => {
    const out = processInput('fibonacci 5');
    expect(out).toContain('Fibonacci');
  });
});
