import {
  luhnCheck,
  detectCardType,
  validateCard,
  analyzeCard,
  luhnSteps,
  luhnCheckDigit,
  groupDigits,
  getCardBrand,
  maskCardNumber,
} from '@/Components/Functions/CreditCardTools/logic';

describe('luhnCheck', () => {
  it('valid Visa test number passes', () => expect(luhnCheck('4532015112830366')).toBe(true));
  it('invalid number fails', () => expect(luhnCheck('1234567890123456')).toBe(false));
  it('valid Mastercard passes', () => expect(luhnCheck('5425233430109903')).toBe(true));
  it('valid AmEx passes', () => expect(luhnCheck('378282246310005')).toBe(true));
  it('short number returns false', () => expect(luhnCheck('123')).toBe(false));
  it('handles spaces in input', () => expect(luhnCheck('4532 0151 1283 0366')).toBe(true));
});

describe('detectCardType', () => {
  it('detects Visa', () => expect(detectCardType('4532015112830366')).toBe('Visa'));
  it('detects Mastercard', () => expect(detectCardType('5425233430109903')).toBe('Mastercard'));
  it('detects American Express', () => expect(detectCardType('378282246310005')).toBe('American Express'));
  it('returns Unknown for unrecognized', () => expect(detectCardType('9999999999999999')).toBe('Unknown'));
});

describe('validateCard', () => {
  it('includes Card Type in output', () => expect(validateCard('4532015112830366')).toContain('Card Type:'));
  it('includes Luhn Valid in output', () => expect(validateCard('4532015112830366')).toContain('Luhn Valid:'));
  it('shows Yes for valid card', () => expect(validateCard('4532015112830366')).toContain('Yes ✓'));
  it('shows No for invalid card', () => expect(validateCard('1234567890123456')).toContain('No ✗'));
  it('throws for empty input', () => expect(() => validateCard('')).toThrow());
});

describe('luhnSteps', () => {
  it('returns one step per digit, in reading order', () => {
    const steps = luhnSteps('4532015112830366');
    expect(steps).toHaveLength(16);
    expect(steps.map(s => s.digit).join('')).toBe('4532015112830366');
    expect(steps[0].position).toBe(1);
  });

  it('never doubles the check digit', () => {
    for (const n of ['4532015112830366', '378282246310005', '30569309025904']) {
      const steps = luhnSteps(n);
      expect(steps[steps.length - 1].fromRight).toBe(1);
      expect(steps[steps.length - 1].doubled).toBe(false);
    }
  });

  it('doubles every second digit counting from the right, so parity follows the length', () => {
    // 16 digits: the leftmost is 16th from the right, so it doubles.
    expect(luhnSteps('4532015112830366')[0].doubled).toBe(true);
    // 15 digits: the leftmost is 15th from the right, so it does not.
    expect(luhnSteps('378282246310005')[0].doubled).toBe(false);
  });

  it('casts out nines after doubling', () => {
    const step = luhnSteps('4532015112830366').find(s => s.doubled && s.digit > 4);
    expect(step!.contribution).toBe(step!.digit * 2 - 9);
  });

  it('accumulates the running total left to right, ending at the full sum', () => {
    const steps = luhnSteps('4532015112830366');
    expect(steps[steps.length - 1].running).toBe(steps.reduce((t, s) => t + s.contribution, 0));
    expect(steps[steps.length - 1].running % 10).toBe(0);
  });
});

describe('luhnCheckDigit', () => {
  it('reproduces the check digit of every valid test number', () => {
    for (const n of [
      '4532015112830366',
      '5425233430109903',
      '378282246310005',
      '6011111111111117',
      '30569309025904',
      '3566002020360505',
    ]) {
      expect(luhnCheckDigit(n.slice(0, -1))).toBe(n.slice(-1));
    }
  });
});

describe('groupDigits', () => {
  it('uses the brand pattern', () => {
    expect(groupDigits('378282246310005', [4, 6, 5])).toBe('3782 822463 10005');
    expect(groupDigits('30569309025904', [4, 6, 4])).toBe('3056 930902 5904');
  });
  it('spills anything past the pattern in fours', () => {
    expect(groupDigits('4532015112830366999', [4, 4, 4, 4])).toBe('4532 0151 1283 0366 999');
  });
  it('stops early on a short number', () => {
    expect(groupDigits('4532', [4, 4, 4, 4])).toBe('4532');
  });
});

describe('getCardBrand', () => {
  it('agrees with detectCardType', () => {
    expect(getCardBrand('4532015112830366')!.name).toBe('Visa');
    expect(getCardBrand('378282246310005')!.cvvLength).toBe(4);
    expect(getCardBrand('30569309025904')!.grouping).toEqual([4, 6, 4]);
  });
  it('returns null for an unknown IIN', () => {
    expect(getCardBrand('9999999999999999')).toBeNull();
  });
});

describe('maskCardNumber', () => {
  it('keeps the first six and last four', () => {
    expect(maskCardNumber('4532015112830366')).toBe('453201••••••0366');
  });
  it('leaves short numbers alone', () => {
    expect(maskCardNumber('4532')).toBe('4532');
  });
});

describe('analyzeCard', () => {
  it('accepts a valid Visa', () => {
    const r = analyzeCard('4532 0151 1283 0366');
    expect(r.brandName).toBe('Visa');
    expect(r.luhnValid).toBe(true);
    expect(r.lengthValid).toBe(true);
    expect(r.valid).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it('formats AmEx as 4-6-5', () => {
    expect(analyzeCard('378282246310005').formatted).toBe('3782 822463 10005');
  });

  it('names the digit that was mistyped', () => {
    const r = analyzeCard('4532015112830367');
    expect(r.valid).toBe(false);
    expect(r.checkDigit).toBe('7');
    expect(r.expectedCheckDigit).toBe('6');
    expect(r.issues[0]).toMatch(/Luhn/);
  });

  it('rejects a length the network does not issue even when Luhn passes', () => {
    // 4-prefixed, Luhn-valid, but 14 digits — Visa issues 13, 16 or 19.
    const digits = '4532015112830';
    const withCheck = digits + luhnCheckDigit(digits);
    const r = analyzeCard(withCheck);
    expect(r.luhnValid).toBe(true);
    expect(r.lengthValid).toBe(false);
    expect(r.valid).toBe(false);
    expect(r.issues.some(i => i.includes('Visa'))).toBe(true);
  });

  it('flags a number that is too short before anything else', () => {
    const r = analyzeCard('4532');
    expect(r.luhnValid).toBe(false);
    expect(r.issues[0]).toMatch(/Too short/);
  });

  it('reports an unknown network without claiming a length rule', () => {
    const r = analyzeCard('9999999999999999');
    expect(r.brand).toBeNull();
    expect(r.brandName).toBe('Unknown');
    expect(r.issues.some(i => i.includes('no major network'))).toBe(true);
  });

  it('throws for empty input', () => expect(() => analyzeCard('   ')).toThrow());
});
