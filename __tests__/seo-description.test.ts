import { padDescription, toolMetadata } from '@/lib/seo';

describe('padDescription', () => {
  it('pads a short description into the 120-160 range', () => {
    const out = padDescription('Online Binary to Hex converter. Instant Binary to Hex conversion.');
    expect(out.length).toBeGreaterThanOrEqual(120);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.startsWith('Online Binary to Hex converter.')).toBe(true);
  });

  it('leaves a long description alone', () => {
    const long = 'x'.repeat(130);
    expect(padDescription(long)).toBe(long);
  });

  it('adds a full stop before the suffix when missing', () => {
    expect(padDescription('Hash text with MD5')).toContain('Hash text with MD5. ');
  });

  it('never exceeds 160 characters', () => {
    expect(padDescription('y'.repeat(119)).length).toBeLessThanOrEqual(160);
  });

  it('feeds the padded text to Open Graph and Twitter too', () => {
    const m = toolMetadata('/x', { title: 'X', description: 'Short one.' });
    expect(m.openGraph?.description).toBe(m.description);
    expect(m.twitter?.description).toBe(m.description);
  });
});
