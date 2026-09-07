import {
  LZ_VARIANTS,
  LzVariant,
  describeLz,
  isLzVariant,
  lzCompress,
  lzDecompress,
  lzStats,
} from '@/Components/Functions/LzStringTools/logic';
import { OPERATION_MAP } from '@/lib/blocks/registry';

const SAMPLE = 'Hello, world! Hello, world! Hello, world!';

describe('LZString round trips', () => {
  it.each(LZ_VARIANTS)('%s survives a round trip', (variant) => {
    expect(lzDecompress(lzCompress(SAMPLE, variant), variant)).toBe(SAMPLE);
  });

  it.each(LZ_VARIANTS)('%s round trips astral and accented text', (variant) => {
    const text = 'naïve café € — 🎉 日本語';
    expect(lzDecompress(lzCompress(text, variant), variant)).toBe(text);
  });

  it.each(LZ_VARIANTS)('%s maps empty to empty in both directions', (variant) => {
    expect(lzCompress('', variant)).toBe('');
    expect(lzDecompress('', variant)).toBe('');
  });
});

describe('variant payloads', () => {
  it('matches the reference Base64 output', () => {
    expect(lzCompress(SAMPLE, 'base64')).toBe('BIUwNmD2A0AEDukBOYAmBCWoIwctm2UciKGQA===');
  });

  it('produces a URL-safe payload that needs no escaping', () => {
    const payload = lzCompress(SAMPLE, 'uri');
    expect(payload).toMatch(/^[A-Za-z0-9+\-$]*$/);
    expect(encodeURIComponent(payload)).toBe(payload);
  });

  it('emits an even number of lowercase hex digits', () => {
    const payload = lzCompress(SAMPLE, 'hex');
    expect(payload).toMatch(/^[0-9a-f]+$/);
    expect(payload.length % 2).toBe(0);
  });

  it('packs UTF-16 tighter than Base64', () => {
    expect(lzCompress(SAMPLE, 'utf16').length).toBeLessThan(lzCompress(SAMPLE, 'base64').length);
  });

  it('decompresses a payload made for the empty string', () => {
    // "Q===" is a real payload, not a failure, so it must not be rejected.
    expect(lzDecompress('Q===', 'base64')).toBe('');
  });
});

describe('rejecting input that was never LZString', () => {
  it.each(LZ_VARIANTS)('%s rejects prose', (variant) => {
    expect(() => lzDecompress('this is not compressed at all', variant)).toThrow();
  });

  it('names the variant in the message', () => {
    expect(() => lzDecompress('!!!!', 'base64')).toThrow(/Base64/);
  });

  it('explains bad hex in hex terms', () => {
    expect(() => lzDecompress('zzzz', 'hex')).toThrow(/not valid hex/i);
    expect(() => lzDecompress('abc', 'hex')).toThrow(/odd number/i);
  });
});

describe('stats', () => {
  it('reports the shrink of a repetitive string', () => {
    const output = lzCompress(SAMPLE, 'base64');
    const stats = lzStats(SAMPLE, output);
    expect(stats.inputChars).toBe(SAMPLE.length);
    expect(stats.outputChars).toBe(output.length);
    expect(stats.savedPercent).toBeGreaterThan(0);
    expect(describeLz(stats)).toMatch(/smaller/);
  });

  it('counts UTF-8 bytes, not characters, for the input', () => {
    const stats = lzStats('€', 'x');
    expect(stats.inputChars).toBe(1);
    expect(stats.inputBytes).toBe(3);
  });

  it('calls a payload longer than its input larger', () => {
    const stats = lzStats('a', lzCompress('a', 'base64'));
    expect(stats.savedPercent).toBeLessThan(0);
    expect(describeLz(stats)).toMatch(/larger/);
  });

  it('measures what a query string would cost', () => {
    // Base64 spends '+' and '=' that a URL has to escape; the URL-safe variant does not.
    const b64 = lzCompress(SAMPLE, 'base64');
    expect(lzStats(SAMPLE, b64).urlChars).toBeGreaterThan(b64.length);
    const uri = lzCompress(SAMPLE, 'uri');
    expect(lzStats(SAMPLE, uri).urlChars).toBe(uri.length);
  });
});

describe('isLzVariant', () => {
  it('accepts every declared variant and nothing else', () => {
    LZ_VARIANTS.forEach((v) => expect(isLzVariant(v)).toBe(true));
    expect(isLzVariant('gzip')).toBe(false);
    expect(isLzVariant(null)).toBe(false);
    expect(isLzVariant('')).toBe(false);
  });
});

// Guards the cast in the component, which reads the variant off the query string.
const asVariant = (value: string): LzVariant => {
  if (!isLzVariant(value)) throw new Error('not a variant');
  return value;
};

it('narrows a query-string value to a variant', () => {
  expect(asVariant('utf16')).toBe('utf16');
});

describe('blocks registry', () => {
  /** Run an operation the way the pipeline does: defaults filled in, then overrides. */
  const run = (id: string, input: string, overrides: Record<string, string> = {}): string => {
    const op = OPERATION_MAP[id];
    if (!op) throw new Error(`operation "${id}" is not registered`);
    const params = Object.fromEntries(op.params.map((p) => [p.id, p.default]));
    return op.fn(input, { ...params, ...overrides });
  };

  it.each(LZ_VARIANTS)('round trips through the pipeline as %s', (variant) => {
    const payload = run('lzstring-compress', SAMPLE, { variant });
    expect(payload).toBe(lzCompress(SAMPLE, variant));
    expect(run('lzstring-decompress', payload, { variant })).toBe(SAMPLE);
  });

  it('defaults to Base64 when the variant is missing or unknown', () => {
    expect(run('lzstring-compress', SAMPLE)).toBe(lzCompress(SAMPLE, 'base64'));
    expect(run('lzstring-compress', SAMPLE, { variant: 'nonsense' })).toBe(
      lzCompress(SAMPLE, 'base64'),
    );
  });

  it('throws a message the block can show', () => {
    expect(() => run('lzstring-decompress', 'not a payload')).toThrow(/not valid LZString/);
  });
});
