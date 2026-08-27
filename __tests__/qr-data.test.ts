import { parseQrData, formatQrResult, processQrData } from '@/Components/Functions/QrDataTools/logic';

describe('parseQrData', () => {
  it('detects URL', () => {
    const r = parseQrData('https://example.com/path?q=1');
    expect(r.type).toBe('url');
    expect(r.label).toBe('URL');
    expect(r.fields.some(f => f.key === 'Host')).toBe(true);
  });

  it('detects WiFi', () => {
    const r = parseQrData('WIFI:T:WPA;S:MyNetwork;P:secret123;;');
    expect(r.type).toBe('wifi');
    expect(r.fields.some(f => f.key === 'SSID' && f.value === 'MyNetwork')).toBe(true);
    expect(r.fields.some(f => f.key === 'Password' && f.value === 'secret123')).toBe(true);
  });

  it('detects geo', () => {
    const r = parseQrData('geo:37.786971,-122.399677');
    expect(r.type).toBe('geo');
    expect(r.fields[0].key).toBe('Latitude');
    expect(r.fields[1].key).toBe('Longitude');
  });

  it('detects mailto', () => {
    const r = parseQrData('mailto:test@example.com?subject=Hello');
    expect(r.type).toBe('email');
    expect(r.fields[0].value).toBe('test@example.com');
  });

  it('detects tel', () => {
    const r = parseQrData('tel:+15551234567');
    expect(r.type).toBe('phone');
    expect(r.fields[0].value).toBe('+15551234567');
  });

  it('detects SMSTO', () => {
    const r = parseQrData('SMSTO:+15551234567:Hello there');
    expect(r.type).toBe('sms');
    expect(r.fields.some(f => f.value === 'Hello there')).toBe(true);
  });

  it('detects vCard', () => {
    const vcard = 'BEGIN:VCARD\nFN:John Doe\nEMAIL:john@example.com\nEND:VCARD';
    const r = parseQrData(vcard);
    expect(r.type).toBe('vcard');
    expect(r.fields.some(f => f.key === 'Full Name' && f.value === 'John Doe')).toBe(true);
  });

  it('detects MECARD', () => {
    const r = parseQrData('MECARD:N:Doe,John;TEL:123456789;');
    expect(r.type).toBe('mecard');
    expect(r.fields.some(f => f.key === 'Name')).toBe(true);
  });

  it('falls back to plain text', () => {
    const r = parseQrData('just some plain text');
    expect(r.type).toBe('plain');
    expect(r.fields[0].value).toBe('just some plain text');
  });
});

describe('formatQrResult', () => {
  it('includes type label', () => {
    const r = parseQrData('https://devoven.com');
    const out = formatQrResult(r);
    expect(out).toContain('Type: URL');
  });
});

describe('processQrData', () => {
  it('returns formatted output', () => {
    const out = processQrData('https://devoven.com');
    expect(out).toContain('Type:');
    expect(out).toContain('Host');
  });

  it('throws on empty input', () => {
    expect(() => processQrData('')).toThrow();
  });
});
