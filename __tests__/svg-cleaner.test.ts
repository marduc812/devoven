import { cleanSvg, getSvgStats } from '../Components/Functions/SvgCleanerTools/logic';

// ─── cleanSvg ─────────────────────────────────────────────────────────────────

describe('cleanSvg', () => {
  it('removes XML declaration', () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?>\n<svg></svg>';
    expect(cleanSvg(input)).not.toContain('<?xml');
  });

  it('removes HTML comments', () => {
    const input = '<svg><!-- This is a comment --><rect/></svg>';
    expect(cleanSvg(input)).not.toContain('<!--');
  });

  it('removes title element', () => {
    const input = '<svg><title>My Icon</title><path/></svg>';
    expect(cleanSvg(input)).not.toContain('<title>');
  });

  it('removes desc element', () => {
    const input = '<svg><desc>Description</desc><path/></svg>';
    expect(cleanSvg(input)).not.toContain('<desc>');
  });

  it('removes metadata element', () => {
    const input = '<svg><metadata><rdf:RDF/></metadata><path/></svg>';
    expect(cleanSvg(input)).not.toContain('<metadata>');
  });

  it('removes data-* attributes', () => {
    const input = '<svg><path data-name="layer1"/></svg>';
    expect(cleanSvg(input)).not.toContain('data-name');
  });

  it('removes xml:space attribute', () => {
    const input = '<svg xml:space="preserve"><path/></svg>';
    expect(cleanSvg(input)).not.toContain('xml:space');
  });

  it('removes empty defs self-closing', () => {
    const input = '<svg><defs/><path/></svg>';
    expect(cleanSvg(input)).not.toContain('<defs');
  });

  it('removes empty defs block', () => {
    const input = '<svg><defs></defs><path/></svg>';
    expect(cleanSvg(input)).not.toContain('<defs>');
  });

  it('preserves meaningful SVG content', () => {
    const input = '<svg viewBox="0 0 24 24"><path d="M12 0L0 24h24z"/></svg>';
    const result = cleanSvg(input);
    expect(result).toContain('path');
    expect(result).toContain('M12 0L0 24h24z');
  });

  it('returns trimmed result', () => {
    const result = cleanSvg('  <svg></svg>  ');
    expect(result).toBe(result.trim());
  });
});

// ─── getSvgStats ──────────────────────────────────────────────────────────────

describe('getSvgStats', () => {
  it('reports original size', () => {
    const original = '<svg><!-- comment --></svg>';
    const cleaned = '<svg></svg>';
    const stats = getSvgStats(original, cleaned);
    expect(stats).toContain('Original:');
  });

  it('reports cleaned size', () => {
    const original = '<svg><!-- comment --></svg>';
    const cleaned = '<svg></svg>';
    const stats = getSvgStats(original, cleaned);
    expect(stats).toContain('Cleaned:');
  });

  it('reports savings', () => {
    const original = '<svg><!-- comment --></svg>';
    const cleaned = '<svg></svg>';
    const stats = getSvgStats(original, cleaned);
    expect(stats).toContain('Saved:');
  });

  it('shows positive savings when file is reduced', () => {
    const original = '<svg><!-- large comment to be removed --><path/></svg>';
    const cleaned = '<svg><path/></svg>';
    const stats = getSvgStats(original, cleaned);
    expect(stats).toMatch(/Saved:\s+\d+ bytes \(\d+%\)/);
  });

  it('handles empty strings without throwing', () => {
    expect(() => getSvgStats('', '')).not.toThrow();
  });
});
