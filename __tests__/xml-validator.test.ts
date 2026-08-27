import {
  validateXml,
  formatXmlValidation,
  prettyPrintXml,
} from '../Components/Functions/XmlValidatorTools/logic';

// ─── validateXml ──────────────────────────────────────────────────────────────

describe('validateXml', () => {
  it('validates simple valid XML', () => {
    const result = validateXml('<root><child>text</child></root>');
    expect(result.valid).toBe(true);
  });
  it('validates self-closing tags', () => {
    const result = validateXml('<root><br/><hr/></root>');
    expect(result.valid).toBe(true);
  });
  it('validates XML with attributes', () => {
    const result = validateXml('<root id="1"><item class="foo">bar</item></root>');
    expect(result.valid).toBe(true);
  });
  it('detects unclosed tags', () => {
    const result = validateXml('<root><child>text</root>');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
  it('detects unexpected closing tag', () => {
    const result = validateXml('<root></wrong></root>');
    expect(result.valid).toBe(false);
  });
  it('returns error for empty input', () => {
    const result = validateXml('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Input is empty');
  });
  it('returns stats for valid XML', () => {
    const result = validateXml('<root><a>text</a></root>');
    expect(result.stats).toBeDefined();
    expect(result.stats!.elements).toBeGreaterThan(0);
  });
  it('handles XML comments', () => {
    const result = validateXml('<root><!-- comment --><child/></root>');
    expect(result.valid).toBe(true);
  });
});

// ─── formatXmlValidation ──────────────────────────────────────────────────────

describe('formatXmlValidation', () => {
  it('formats valid result with checkmark', () => {
    const result = validateXml('<root><child/></root>');
    const formatted = formatXmlValidation(result);
    expect(formatted).toContain('✓ Valid XML');
    expect(formatted).toContain('Elements:');
  });
  it('formats invalid result with error', () => {
    const formatted = formatXmlValidation({ valid: false, error: 'Test error' });
    expect(formatted).toContain('✗ Invalid XML');
    expect(formatted).toContain('Test error');
  });
  it('includes element count in valid output', () => {
    const result = validateXml('<root><a/><b/></root>');
    const formatted = formatXmlValidation(result);
    expect(formatted).toContain('Elements:');
  });
});

// ─── prettyPrintXml ───────────────────────────────────────────────────────────

describe('prettyPrintXml', () => {
  it('adds indentation to nested elements', () => {
    const input = '<root><child>text</child></root>';
    const result = prettyPrintXml(input);
    expect(result).toContain('\n');
  });
  it('handles already-formatted XML', () => {
    const input = '<root>\n  <child>text</child>\n</root>';
    const result = prettyPrintXml(input);
    expect(result).toContain('<root>');
    expect(result).toContain('<child>');
  });
  it('trims leading/trailing whitespace', () => {
    const result = prettyPrintXml('  <root/>  ');
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/\s$/);
  });
  it('handles self-closing tags', () => {
    const result = prettyPrintXml('<root><br/></root>');
    expect(result).toContain('<br/>');
  });
});
