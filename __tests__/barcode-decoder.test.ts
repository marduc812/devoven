import { decodeBarcode, formatBarcode } from '@/Components/Functions/BarcodeInfoTools/logic';

describe('decodeBarcode', () => {
  // Valid EAN-13: 5901234123457
  it('validates a correct EAN-13', () => {
    const r = decodeBarcode('5901234123457');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('EAN-13');
  });

  it('detects invalid check digit', () => {
    const r = decodeBarcode('5901234123456');
    expect(r.valid).toBe(false);
  });

  // ISBN-13: 9780306406157
  it('detects ISBN-13 prefix 978', () => {
    const r = decodeBarcode('9780306406157');
    expect(r.type).toBe('ISBN-13');
    expect(r.valid).toBe(true);
  });

  // ISSN: 9770317197009
  it('detects ISSN prefix 977', () => {
    const r = decodeBarcode('9770317197009');
    expect(r.type).toBe('ISSN');
  });

  // UPC-A: 036000291452
  it('handles 12-digit UPC-A', () => {
    const r = decodeBarcode('036000291452');
    expect(r.type).toBe('UPC-A');
  });

  it('UPC-A check digit validated', () => {
    const r = decodeBarcode('036000291452');
    expect(r.valid).toBe(true);
  });

  it('extracts GS1 prefix', () => {
    const r = decodeBarcode('9780306406157');
    expect(r.gs1Prefix).toBeDefined();
    expect(r.gs1Description).toBeDefined();
  });

  it('provides check digit steps', () => {
    const r = decodeBarcode('5901234123457');
    expect(r.checkSteps).toHaveLength(12);
  });

  it('throws for non-digit input', () => {
    expect(() => decodeBarcode('abc')).toThrow();
  });

  it('throws for wrong length', () => {
    expect(() => decodeBarcode('12345')).toThrow();
  });

  it('strips spaces from input', () => {
    const r = decodeBarcode('590 1234 1234 57');
    expect(r.valid).toBe(true);
  });

  it('ISMN prefix 979-0', () => {
    // 9790060115615 is a valid ISMN
    const r = decodeBarcode('9790060115615');
    expect(r.type).toBe('ISMN');
  });
});

describe('formatBarcode', () => {
  it('includes type and validity in output', () => {
    const out = formatBarcode('9780306406157');
    expect(out).toContain('Type');
    expect(out).toContain('Valid');
  });

  it('includes GS1 prefix info', () => {
    const out = formatBarcode('9780306406157');
    expect(out).toContain('GS1');
  });
});
