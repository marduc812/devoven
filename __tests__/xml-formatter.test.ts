import { formatXml } from '@/Components/Functions/CodeFormatters/logic';

describe('formatXml', () => {
  it('returns empty string for empty input', () => {
    expect(formatXml('', 2)).toBe('');
  });

  it('formats simple XML with indentation', () => {
    const input = '<root><child>value</child></root>';
    const result = formatXml(input, 2);
    expect(result).toContain('<root>');
    expect(result).toContain('<child>');
    expect(result).toContain('value');
  });

  it('adds XML declaration if not present', () => {
    const input = '<root><item/></root>';
    const result = formatXml(input, 2);
    expect(result.trim().startsWith('<?xml')).toBe(true);
  });

  it('preserves XML declaration when present', () => {
    const input = '<?xml version="1.0"?><root/>';
    const result = formatXml(input, 2);
    expect(result).toContain('<?xml');
  });

  it('uses 2-space indentation', () => {
    const input = '<root><child>text</child></root>';
    const result = formatXml(input, 2);
    const lines = result.split('\n');
    const childLine = lines.find(l => l.includes('<child>'));
    expect(childLine).toBeDefined();
    expect(childLine!.startsWith('  ')).toBe(true);
  });

  it('uses 4-space indentation', () => {
    const input = '<root><child>text</child></root>';
    const result = formatXml(input, 4);
    const lines = result.split('\n');
    const childLine = lines.find(l => l.includes('<child>'));
    expect(childLine).toBeDefined();
    expect(childLine!.startsWith('    ')).toBe(true);
  });

  it('handles attributes', () => {
    const input = '<root id="1"><item key="val"/></root>';
    const result = formatXml(input, 2);
    expect(result).toContain('id="1"');
    expect(result).toContain('key="val"');
  });

  it('handles whitespace-only input', () => {
    expect(formatXml('   ', 2)).toBe('');
  });

  it('handles nested elements', () => {
    const input = '<a><b><c>deep</c></b></a>';
    const result = formatXml(input, 2);
    expect(result).toContain('deep');
    const lines = result.split('\n');
    const deepLine = lines.find(l => l.includes('deep'));
    expect(deepLine).toBeDefined();
    // Should have at least 4 spaces (2 levels of 2-space indent)
    expect(deepLine!.match(/^ +/)?.[0].length).toBeGreaterThanOrEqual(4);
  });
});
