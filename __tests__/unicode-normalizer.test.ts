import {
  normalizeText,
  getAllForms,
  getFormDescription,
  type NormalizationForm,
} from '@/Components/Functions/UnicodeNormalizerTools/logic';

// ─── normalizeText ────────────────────────────────────────────────────────────

describe('normalizeText', () => {
  it('NFC normalizes composed form', () => {
    // 'é' can be represented as precomposed (U+00E9) or decomposed (e + U+0301)
    const decomposed = 'e\u0301'; // e + combining acute
    const result = normalizeText(decomposed, 'NFC');
    expect(result).toBe('\u00E9'); // precomposed é
  });

  it('NFD decomposes composed characters', () => {
    const composed = '\u00E9'; // precomposed é
    const result = normalizeText(composed, 'NFD');
    expect(result).toBe('e\u0301'); // e + combining acute
  });

  it('NFKC converts compatibility characters', () => {
    // fi ligature (U+FB01) → fi
    const result = normalizeText('\uFB01', 'NFKC');
    expect(result).toBe('fi');
  });

  it('NFKD also decomposes compatibility characters', () => {
    const result = normalizeText('\uFB01', 'NFKD');
    expect(result).toBe('fi');
  });

  it('returns same string for ASCII text in any form', () => {
    const text = 'Hello World 123';
    const forms: NormalizationForm[] = ['NFC', 'NFD', 'NFKC', 'NFKD'];
    for (const form of forms) {
      expect(normalizeText(text, form)).toBe(text);
    }
  });

  it('handles empty string', () => {
    expect(normalizeText('', 'NFC')).toBe('');
  });
});

// ─── getAllForms ──────────────────────────────────────────────────────────────

describe('getAllForms', () => {
  it('includes all four normalization forms', () => {
    const result = getAllForms('hello');
    expect(result).toContain('NFC:');
    expect(result).toContain('NFD:');
    expect(result).toContain('NFKC:');
    expect(result).toContain('NFKD:');
  });

  it('marks unchanged forms with (unchanged)', () => {
    const result = getAllForms('hello'); // ASCII is same in all forms
    expect(result).toContain('(unchanged)');
  });

  it('marks changed forms with (changed)', () => {
    const result = getAllForms('\uFB01'); // fi ligature changes in NFKC/NFKD
    expect(result).toContain('(changed)');
  });
});

// ─── getFormDescription ───────────────────────────────────────────────────────

describe('getFormDescription', () => {
  it('returns description for NFC', () => {
    const desc = getFormDescription('NFC');
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(10);
  });

  it('returns description for NFD', () => {
    const desc = getFormDescription('NFD');
    expect(desc).toContain('Decomposition');
  });

  it('returns description for NFKC', () => {
    const desc = getFormDescription('NFKC');
    expect(desc).toContain('Compatibility');
  });

  it('returns description for NFKD', () => {
    const desc = getFormDescription('NFKD');
    expect(desc).toContain('Compatibility');
  });
});
