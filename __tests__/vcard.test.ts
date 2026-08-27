import { generateVcard, parseVcard, parseKeyValueInput, detectVcardOrInput } from '../Components/Functions/VcardTools/logic';

describe('parseKeyValueInput', () => {
  it('parses key=value pairs', () => {
    const result = parseKeyValueInput('name=Alice\nemail=alice@example.com');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
  });

  it('parses key: value pairs', () => {
    const result = parseKeyValueInput('name: Bob\nphone: 555-1234');
    expect(result.name).toBe('Bob');
    expect(result.phone).toBe('555-1234');
  });

  it('ignores comment lines', () => {
    const result = parseKeyValueInput('# comment\nname=Alice');
    expect(result['# comment']).toBeUndefined();
    expect(result.name).toBe('Alice');
  });
});

describe('generateVcard', () => {
  it('returns empty string for empty input', () => {
    expect(generateVcard('')).toBe('');
  });

  it('generates vCard with BEGIN/END markers', () => {
    const result = generateVcard('name=Alice');
    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('END:VCARD');
    expect(result).toContain('VERSION:3.0');
  });

  it('includes FN field for name', () => {
    const result = generateVcard('name=Alice Smith');
    expect(result).toContain('FN:Alice Smith');
  });

  it('includes EMAIL field', () => {
    const result = generateVcard('name=Alice\nemail=alice@example.com');
    expect(result).toContain('EMAIL');
    expect(result).toContain('alice@example.com');
  });

  it('includes TEL field for phone', () => {
    const result = generateVcard('name=Alice\nphone=555-1234');
    expect(result).toContain('TEL');
    expect(result).toContain('555-1234');
  });

  it('includes ORG field', () => {
    const result = generateVcard('name=Alice\norg=Acme Corp');
    expect(result).toContain('ORG:Acme Corp');
  });

  it('includes NOTE field', () => {
    const result = generateVcard('name=Alice\nnote=Hello world');
    expect(result).toContain('NOTE:Hello world');
  });
});

describe('parseVcard', () => {
  it('returns empty string for empty input', () => {
    expect(parseVcard('')).toBe('');
  });

  it('returns error for non-vCard input', () => {
    expect(parseVcard('name=Alice')).toContain('Error');
  });

  it('parses FN field to name', () => {
    const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Alice Smith\r\nEND:VCARD';
    const result = parseVcard(vcard);
    expect(result).toContain('name: Alice Smith');
  });

  it('parses EMAIL field', () => {
    const vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\nEMAIL;TYPE=INTERNET:alice@example.com\r\nEND:VCARD';
    const result = parseVcard(vcard);
    expect(result).toContain('email: alice@example.com');
  });

  it('round-trips a vCard', () => {
    const input = 'name=Alice Smith\nemail=alice@example.com\nphone=555-1234\norg=Acme';
    const generated = generateVcard(input);
    const parsed = parseVcard(generated);
    expect(parsed).toContain('Alice Smith');
    expect(parsed).toContain('alice@example.com');
  });
});

describe('detectVcardOrInput', () => {
  it('detects vCard', () => {
    expect(detectVcardOrInput('BEGIN:VCARD\nFN:Alice\nEND:VCARD')).toBe('vcard');
  });

  it('detects input', () => {
    expect(detectVcardOrInput('name=Alice')).toBe('input');
  });
});
