import {
  parseAnyBase,
  bitwiseOp,
  permissionsToOctal,
  permissionsToSymbolic,
  octalToPermissions,
  chmodCommand,
  parseNumbers,
  calcMean,
  calcMedian,
  calcMode,
  calcStdDev,
  calcStats,
  generateGitignore,
  listGitignoreTemplates,
  analyzePassword,
  curlToFetch,
  getWordFrequency,
  estimateReadingTime,
  fleschReadingEase,
  fleschLabel,
} from '../Components/Functions/DevTools/logic';

// ── parseAnyBase ──────────────────────────────────────────────────────────────

describe('parseAnyBase', () => {
  it('parses hex with 0x prefix', () => {
    expect(parseAnyBase('0xFF')).toBe(255);
  });
  it('parses binary with 0b prefix', () => {
    expect(parseAnyBase('0b1010')).toBe(10);
  });
  it('parses decimal', () => {
    expect(parseAnyBase('42')).toBe(42);
  });
  it('parses bare binary (4+ digits)', () => {
    expect(parseAnyBase('1010')).toBe(10);
  });
  it('throws on unparseable string', () => {
    expect(() => parseAnyBase('abc')).toThrow();
  });
});

// ── bitwiseOp ─────────────────────────────────────────────────────────────────

describe('bitwiseOp', () => {
  it('AND 0b1010 AND 0b1100 = 0b1000', () => {
    expect(bitwiseOp('0b1010', '0b1100', 'AND').decimal).toBe('8');
  });
  it('XOR returns correct hex', () => {
    expect(bitwiseOp('255', '85', 'XOR').hex).toBe('0xAA');
  });
  it('NOT flips bits (32-bit)', () => {
    expect(bitwiseOp('0', '', 'NOT').decimal).toBe('4294967295');
  });
  it('OR combines bits', () => {
    expect(bitwiseOp('0b1010', '0b0101', 'OR').binary).toBe('1111');
  });
  it('LSHIFT left shifts', () => {
    expect(bitwiseOp('1', '3', 'LSHIFT').decimal).toBe('8');
  });
  it('RSHIFT right shifts', () => {
    expect(bitwiseOp('16', '2', 'RSHIFT').decimal).toBe('4');
  });
  it('NAND is NOT of AND', () => {
    expect(bitwiseOp('0xFFFFFFFF', '0xFFFFFFFF', 'NAND').decimal).toBe('0');
  });
  it('NOR is NOT of OR', () => {
    expect(bitwiseOp('0', '0', 'NOR').decimal).toBe('4294967295');
  });
});

// ── permissionsToOctal ────────────────────────────────────────────────────────

describe('permissionsToOctal', () => {
  it('rwxr-xr-x = 755', () => {
    expect(permissionsToOctal({
      owner:{read:true,write:true,execute:true},
      group:{read:true,write:false,execute:true},
      other:{read:true,write:false,execute:true}
    })).toBe('755');
  });
  it('rw-rw-rw- = 666', () => {
    expect(permissionsToOctal({
      owner:{read:true,write:true,execute:false},
      group:{read:true,write:true,execute:false},
      other:{read:true,write:true,execute:false}
    })).toBe('666');
  });
  it('rwxrwxrwx = 777', () => {
    expect(permissionsToOctal({
      owner:{read:true,write:true,execute:true},
      group:{read:true,write:true,execute:true},
      other:{read:true,write:true,execute:true}
    })).toBe('777');
  });
  it('--------- = 000', () => {
    expect(permissionsToOctal({
      owner:{read:false,write:false,execute:false},
      group:{read:false,write:false,execute:false},
      other:{read:false,write:false,execute:false}
    })).toBe('000');
  });
  it('r-------- = 400', () => {
    expect(permissionsToOctal({
      owner:{read:true,write:false,execute:false},
      group:{read:false,write:false,execute:false},
      other:{read:false,write:false,execute:false}
    })).toBe('400');
  });
});

// ── permissionsToSymbolic ─────────────────────────────────────────────────────

describe('permissionsToSymbolic', () => {
  it('755 = rwxr-xr-x', () => {
    expect(permissionsToSymbolic({
      owner:{read:true,write:true,execute:true},
      group:{read:true,write:false,execute:true},
      other:{read:true,write:false,execute:true}
    })).toBe('rwxr-xr-x');
  });
  it('644 = rw-r--r--', () => {
    expect(permissionsToSymbolic({
      owner:{read:true,write:true,execute:false},
      group:{read:true,write:false,execute:false},
      other:{read:true,write:false,execute:false}
    })).toBe('rw-r--r--');
  });
  it('000 = ---------', () => {
    expect(permissionsToSymbolic({
      owner:{read:false,write:false,execute:false},
      group:{read:false,write:false,execute:false},
      other:{read:false,write:false,execute:false}
    })).toBe('---------');
  });
});

// ── octalToPermissions ────────────────────────────────────────────────────────

describe('octalToPermissions', () => {
  it('755 decodes to rwxr-xr-x', () => {
    const p = octalToPermissions('755');
    expect(p.owner).toEqual({read:true,write:true,execute:true});
    expect(p.group).toEqual({read:true,write:false,execute:true});
    expect(p.other).toEqual({read:true,write:false,execute:true});
  });
  it('644 decodes correctly', () => {
    const p = octalToPermissions('644');
    expect(p.owner).toEqual({read:true,write:true,execute:false});
    expect(p.group).toEqual({read:true,write:false,execute:false});
    expect(p.other).toEqual({read:true,write:false,execute:false});
  });
  it('000 decodes to no permissions', () => {
    const p = octalToPermissions('000');
    expect(p.owner).toEqual({read:false,write:false,execute:false});
  });
  it('throws on invalid input', () => {
    expect(() => octalToPermissions('999')).toThrow();
  });
  it('throws on wrong length', () => {
    expect(() => octalToPermissions('75')).toThrow();
  });
});

// ── chmodCommand ──────────────────────────────────────────────────────────────

describe('chmodCommand', () => {
  it('generates default chmod command', () => {
    expect(chmodCommand('755')).toBe('chmod 755 file');
  });
  it('uses custom path', () => {
    expect(chmodCommand('644', 'myfile.txt')).toBe('chmod 644 myfile.txt');
  });
  it('works with 000', () => {
    expect(chmodCommand('000', '/tmp/test')).toBe('chmod 000 /tmp/test');
  });
});

// ── parseNumbers ──────────────────────────────────────────────────────────────

describe('parseNumbers', () => {
  it('parses comma-separated numbers', () => {
    expect(parseNumbers('1,2,3')).toEqual([1, 2, 3]);
  });
  it('parses newline-separated numbers', () => {
    expect(parseNumbers('1\n2\n3')).toEqual([1, 2, 3]);
  });
  it('parses floats', () => {
    expect(parseNumbers('1.5, 2.5')).toEqual([1.5, 2.5]);
  });
  it('returns empty array for empty input', () => {
    expect(parseNumbers('')).toEqual([]);
  });
  it('throws on non-number', () => {
    expect(() => parseNumbers('1, abc, 3')).toThrow();
  });
});

// ── calcMean ──────────────────────────────────────────────────────────────────

describe('calcMean', () => {
  it('calculates mean of [1,2,3]', () => {
    expect(calcMean([1, 2, 3])).toBe(2);
  });
  it('calculates mean of [10,20]', () => {
    expect(calcMean([10, 20])).toBe(15);
  });
  it('returns single number for single element', () => {
    expect(calcMean([42])).toBe(42);
  });
  it('throws for empty array', () => {
    expect(() => calcMean([])).toThrow();
  });
  it('handles negative numbers', () => {
    expect(calcMean([-1, 1])).toBe(0);
  });
});

// ── calcMedian ────────────────────────────────────────────────────────────────

describe('calcMedian', () => {
  it('median of odd-length array', () => {
    expect(calcMedian([1, 2, 3])).toBe(2);
  });
  it('median of even-length array', () => {
    expect(calcMedian([1, 2, 3, 4])).toBe(2.5);
  });
  it('median of unsorted array', () => {
    expect(calcMedian([5, 1, 3])).toBe(3);
  });
  it('throws for empty array', () => {
    expect(() => calcMedian([])).toThrow();
  });
  it('single element returns itself', () => {
    expect(calcMedian([7])).toBe(7);
  });
});

// ── calcMode ──────────────────────────────────────────────────────────────────

describe('calcMode', () => {
  it('returns empty for all unique values', () => {
    expect(calcMode([1, 2, 3])).toEqual([]);
  });
  it('finds single mode', () => {
    expect(calcMode([1, 2, 2, 3])).toEqual([2]);
  });
  it('finds multiple modes', () => {
    const result = calcMode([1, 1, 2, 2, 3]);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toHaveLength(2);
  });
  it('returns empty for empty array', () => {
    expect(calcMode([])).toEqual([]);
  });
  it('handles all same values', () => {
    expect(calcMode([5, 5, 5])).toEqual([5]);
  });
});

// ── calcStdDev ────────────────────────────────────────────────────────────────

describe('calcStdDev', () => {
  it('calculates sample std dev', () => {
    expect(calcStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0);
  });
  it('calculates population std dev', () => {
    expect(calcStdDev([2, 4, 4, 4, 5, 5, 7, 9], true)).toBeCloseTo(2, 0);
  });
  it('throws for < 2 numbers', () => {
    expect(() => calcStdDev([5])).toThrow();
  });
  it('std dev of identical values is 0', () => {
    expect(calcStdDev([3, 3, 3])).toBe(0);
  });
  it('throws for empty array', () => {
    expect(() => calcStdDev([])).toThrow();
  });
});

// ── calcStats ─────────────────────────────────────────────────────────────────

describe('calcStats', () => {
  it('calculates all stats', () => {
    const s = calcStats('1,2,3,4,5');
    expect(s.count).toBe(5);
    expect(s.sum).toBe(15);
    expect(s.mean).toBe(3);
    expect(s.median).toBe(3);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.range).toBe(4);
  });
  it('throws for empty input', () => {
    expect(() => calcStats('')).toThrow();
  });
  it('handles single number (stdDev is NaN)', () => {
    const s = calcStats('42');
    expect(s.count).toBe(1);
    expect(isNaN(s.stdDev)).toBe(true);
  });
  it('handles negative numbers', () => {
    const s = calcStats('-1,-2,-3');
    expect(s.sum).toBe(-6);
    expect(s.min).toBe(-3);
  });
  it('handles floats', () => {
    const s = calcStats('1.5,2.5');
    expect(s.mean).toBe(2);
  });
});

// ── generateGitignore ─────────────────────────────────────────────────────────

describe('generateGitignore', () => {
  it('returns empty string for empty selection', () => {
    expect(generateGitignore([])).toBe('');
  });
  it('generates single template', () => {
    const result = generateGitignore(['Node.js']);
    expect(result).toContain('node_modules/');
  });
  it('combines multiple templates', () => {
    const result = generateGitignore(['Node.js', 'Python']);
    expect(result).toContain('node_modules/');
    expect(result).toContain('__pycache__/');
  });
  it('ends with newline', () => {
    const result = generateGitignore(['Node.js']);
    expect(result.endsWith('\n')).toBe(true);
  });
  it('unknown template uses comment fallback', () => {
    const result = generateGitignore(['Unknown']);
    expect(result).toContain('# Unknown');
  });
});

// ── listGitignoreTemplates ────────────────────────────────────────────────────

describe('listGitignoreTemplates', () => {
  it('returns an array', () => {
    expect(Array.isArray(listGitignoreTemplates())).toBe(true);
  });
  it('includes Node.js', () => {
    expect(listGitignoreTemplates()).toContain('Node.js');
  });
  it('includes Python', () => {
    expect(listGitignoreTemplates()).toContain('Python');
  });
  it('has at least 10 templates', () => {
    expect(listGitignoreTemplates().length).toBeGreaterThanOrEqual(10);
  });
  it('includes macOS', () => {
    expect(listGitignoreTemplates()).toContain('macOS');
  });
});

// ── analyzePassword ───────────────────────────────────────────────────────────

describe('analyzePassword', () => {
  it('empty password returns Very Weak with score 0', () => {
    const r = analyzePassword('');
    expect(r.score).toBe(0);
    expect(r.label).toBe('Very Weak');
  });
  it('strong password scores high', () => {
    const r = analyzePassword('Tr0ub4dor&3XyZ!');
    expect(r.score).toBeGreaterThanOrEqual(3);
  });
  it('detects common patterns', () => {
    const r = analyzePassword('password123');
    expect(r.hasCommonPatterns).toBe(true);
  });
  it('detects repeated characters', () => {
    const r = analyzePassword('aaa123');
    expect(r.hasRepeats).toBe(true);
  });
  it('detects symbols', () => {
    const r = analyzePassword('Hello@World1');
    expect(r.hasSymbols).toBe(true);
  });
  it('entropy is 0 for empty password', () => {
    expect(analyzePassword('').entropy).toBe(0);
  });
  it('suggestions are provided for weak password', () => {
    const r = analyzePassword('abc');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});

// ── curlToFetch ───────────────────────────────────────────────────────────────

describe('curlToFetch', () => {
  it('converts simple GET', () => {
    const result = curlToFetch("curl https://example.com");
    expect(result).toContain("fetch('https://example.com')");
  });
  it('converts POST with body', () => {
    const result = curlToFetch("curl https://api.example.com -X POST -d '{\"key\":\"val\"}'");
    expect(result).toContain("method: 'POST'");
  });
  it('converts with headers', () => {
    const result = curlToFetch("curl https://api.example.com -H 'Content-Type: application/json'");
    expect(result).toContain('Content-Type');
  });
  it('returns empty string for empty input', () => {
    expect(curlToFetch('')).toBe('');
  });
  it('throws if not starting with curl', () => {
    expect(() => curlToFetch('wget https://example.com')).toThrow();
  });
});

// ── getWordFrequency ──────────────────────────────────────────────────────────

describe('getWordFrequency', () => {
  it('returns empty for empty string', () => {
    expect(getWordFrequency('')).toEqual([]);
  });
  it('counts words correctly', () => {
    const result = getWordFrequency('hello world hello');
    expect(result[0]).toEqual({ word: 'hello', count: 2 });
  });
  it('sorts by count descending', () => {
    const result = getWordFrequency('a a a b b c');
    expect(result[0].word).toBe('a');
    expect(result[0].count).toBe(3);
  });
  it('is case insensitive', () => {
    const result = getWordFrequency('Hello hello HELLO');
    expect(result[0].count).toBe(3);
  });
  it('ignores punctuation', () => {
    const result = getWordFrequency('hello, world!');
    expect(result.length).toBe(2);
  });
});

// ── estimateReadingTime ───────────────────────────────────────────────────────

describe('estimateReadingTime', () => {
  it('returns < 1 minute for short text', () => {
    expect(estimateReadingTime('hello world')).toContain('< 1 minute');
  });
  it('estimates minutes for longer text', () => {
    const text = Array(250).fill('word').join(' ');
    expect(estimateReadingTime(text)).toContain('minute');
  });
  it('includes word count', () => {
    expect(estimateReadingTime('hello world')).toContain('2 words');
  });
  it('handles empty string', () => {
    expect(estimateReadingTime('')).toContain('0 words');
  });
  it('uses custom wpm', () => {
    const text = Array(100).fill('word').join(' ');
    expect(estimateReadingTime(text, 100)).toContain('1 minute');
  });
});

// ── fleschReadingEase ─────────────────────────────────────────────────────────

describe('fleschReadingEase', () => {
  it('returns 0 for empty string', () => {
    expect(fleschReadingEase('')).toBe(0);
  });
  it('returns a number for valid text', () => {
    const score = fleschReadingEase('The cat sat on the mat. It was a good cat.');
    expect(typeof score).toBe('number');
  });
  it('simple text scores high', () => {
    const score = fleschReadingEase('I go. You go. We go.');
    expect(score).toBeGreaterThan(50);
  });
  it('handles single sentence', () => {
    const score = fleschReadingEase('Hello world.');
    expect(typeof score).toBe('number');
  });
  it('returns 0 for whitespace only', () => {
    expect(fleschReadingEase('   ')).toBe(0);
  });
});

// ── fleschLabel ───────────────────────────────────────────────────────────────

describe('fleschLabel', () => {
  it('90+ = Very Easy', () => {
    expect(fleschLabel(90)).toBe('Very Easy');
  });
  it('80-89 = Easy', () => {
    expect(fleschLabel(85)).toBe('Easy');
  });
  it('70-79 = Fairly Easy', () => {
    expect(fleschLabel(75)).toBe('Fairly Easy');
  });
  it('60-69 = Standard', () => {
    expect(fleschLabel(65)).toBe('Standard');
  });
  it('below 30 = Very Confusing', () => {
    expect(fleschLabel(10)).toBe('Very Confusing');
  });
});
