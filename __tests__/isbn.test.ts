import {
  validateIsbn10,
  validateIsbn13,
  convertIsbn10To13,
  convertIsbn13To10,
  validateIsbn,
  analyzeIsbn,
  splitRegistrationGroup,
  isbn10CheckDigit,
  isbn13CheckDigit,
} from '@/Components/Functions/IsbnTools/logic';

describe('validateIsbn10', () => {
  it('validates a correct ISBN-10', () => expect(validateIsbn10('0-306-40615-2')).toBe(true));
  it('rejects an invalid ISBN-10', () => expect(validateIsbn10('0-306-40615-3')).toBe(false));
  it('handles X check digit', () => expect(validateIsbn10('0-19-853453-1')).toBe(true));
  it('rejects wrong length', () => expect(validateIsbn10('123')).toBe(false));
});

describe('validateIsbn13', () => {
  it('validates a correct ISBN-13', () => expect(validateIsbn13('978-0-306-40615-7')).toBe(true));
  it('rejects an invalid ISBN-13', () => expect(validateIsbn13('978-0-306-40615-8')).toBe(false));
  it('rejects wrong length', () => expect(validateIsbn13('123')).toBe(false));
});

describe('convertIsbn10To13', () => {
  it('converts 0-306-40615-2 to 9780306406157', () => {
    expect(convertIsbn10To13('0-306-40615-2')).toBe('9780306406157');
  });
  it('throws for invalid ISBN-10', () => expect(() => convertIsbn10To13('invalid')).toThrow());
});

describe('validateIsbn', () => {
  it('includes valid/invalid result', () => {
    expect(validateIsbn('0-306-40615-2')).toContain('Yes ✓');
  });
  it('includes ISBN-13 conversion for valid ISBN-10', () => {
    expect(validateIsbn('0-306-40615-2')).toContain('ISBN-13:');
  });
  it('throws for wrong length', () => expect(() => validateIsbn('123')).toThrow());
});

describe('convertIsbn13To10', () => {
  it('converts 9780306406157 back to 0306406152', () => {
    expect(convertIsbn13To10('978-0-306-40615-7')).toBe('0306406152');
  });
  it('round-trips every valid ISBN-10 through ISBN-13', () => {
    for (const isbn of ['0306406152', '0198534531', '0131103628', '1861972717']) {
      expect(convertIsbn13To10(convertIsbn10To13(isbn))).toBe(isbn);
    }
  });
  it('refuses 979 numbers, which have no ISBN-10 form', () => {
    expect(() => convertIsbn13To10('9798602401578')).toThrow();
  });
  it('throws for an invalid ISBN-13', () => expect(() => convertIsbn13To10('9780306406158')).toThrow());
});

describe('check digit helpers', () => {
  it('isbn10CheckDigit matches the published number', () => {
    expect(isbn10CheckDigit('030640615')).toBe('2');
  });
  it('isbn10CheckDigit yields X when the remainder is 10', () => {
    expect(isbn10CheckDigit('080442957')).toBe('X');
  });
  it('isbn13CheckDigit matches the published number', () => {
    expect(isbn13CheckDigit('978030640615')).toBe('7');
  });
});

describe('splitRegistrationGroup', () => {
  it('takes one digit for the English group', () => {
    expect(splitRegistrationGroup('978', '030640615')).toBe('0');
  });
  it('takes two digits for Brazil (65)', () => {
    expect(splitRegistrationGroup('978', '650000000')).toBe('65');
  });
  it('takes three digits for the 600-649 block', () => {
    expect(splitRegistrationGroup('978', '600123456')).toBe('600');
  });
  it('takes five digits for the 99900-99999 block', () => {
    expect(splitRegistrationGroup('978', '999001234')).toBe('99900');
  });
  it('uses the 979 ranges under the 979 prefix', () => {
    expect(splitRegistrationGroup('979', '860240157')).toBe('8');
    expect(splitRegistrationGroup('979', '100000000')).toBe('10');
  });
  it('returns null when nothing matches', () => {
    // 6 is not a group on its own and 66/660 fall outside every published range.
    expect(splitRegistrationGroup('978', '660000000')).toBeNull();
  });
});

describe('analyzeIsbn', () => {
  it('reports a valid ISBN-10 with its ISBN-13', () => {
    const r = analyzeIsbn('0-306-40615-2');
    expect(r.kind).toBe('isbn10');
    expect(r.valid).toBe(true);
    expect(r.isbn13).toBe('9780306406157');
    expect(r.corrected).toBeNull();
  });

  it('reports a valid ISBN-13 with its ISBN-10', () => {
    const r = analyzeIsbn('978-0-306-40615-7');
    expect(r.kind).toBe('isbn13');
    expect(r.valid).toBe(true);
    expect(r.isbn10).toBe('0306406152');
  });

  it('names the registration group', () => {
    expect(analyzeIsbn('978-0-306-40615-7').groupName).toBe('English language');
    expect(analyzeIsbn('978-4-06-519982-4').groupName).toBe('Japan');
  });

  it('splits the number into prefix, group, body and check digit', () => {
    const { segments, hyphenated } = analyzeIsbn('9780306406157');
    expect(segments).toEqual({ prefix: '978', group: '0', body: '30640615', check: '7' });
    expect(hyphenated).toBe('978-0-30640615-7');
  });

  it('weights ISBN-10 from 10 down to 1', () => {
    const r = analyzeIsbn('0306406152');
    expect(r.steps).toHaveLength(10);
    expect(r.steps.map(s => s.weight)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(r.sum % r.modulus).toBe(0);
  });

  it('alternates ISBN-13 weights between 1 and 3', () => {
    const r = analyzeIsbn('9780306406157');
    expect(r.steps.map(s => s.weight)).toEqual([1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1]);
    expect(r.sum % r.modulus).toBe(0);
  });

  it('scores X as 10', () => {
    const r = analyzeIsbn('0-19-853453-X');
    expect(r.steps[9].value).toBe(10);
  });

  it('offers the corrected number when the check digit is wrong', () => {
    const r = analyzeIsbn('978-0-306-40615-8');
    expect(r.valid).toBe(false);
    expect(r.expectedCheckDigit).toBe('7');
    expect(r.corrected).toBe('9780306406157');
    expect(r.isbn10).toBeNull();
    expect(r.issues.length).toBeGreaterThan(0);
  });

  it('flags an X inside an ISBN-13 rather than scoring it', () => {
    const r = analyzeIsbn('978030640615X');
    expect(r.valid).toBe(false);
    expect(r.steps).toHaveLength(0);
    expect(r.issues[0]).toMatch(/ISBN-10/);
  });

  it('flags a prefix that is not 978 or 979', () => {
    const r = analyzeIsbn('9770306406154');
    expect(r.issues.some(i => i.includes('977'))).toBe(true);
  });

  it('leaves the group null when no range matches', () => {
    const r = analyzeIsbn('9786600000000');
    expect(r.segments.group).toBeNull();
    expect(r.groupName).toBeNull();
  });

  it('throws for a length that is neither 10 nor 13', () => {
    expect(() => analyzeIsbn('123')).toThrow();
  });
});
