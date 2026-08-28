import {
  buildVcard,
  detectVcardOrInput,
  generateVcard,
  isEmptyVcard,
  parseKeyValueInput,
  parseVcard,
  vcardFilename,
  vcardToFields,
} from '../Components/Functions/VcardTools/logic';

describe('parseKeyValueInput', () => {
  it('splits a single name= line into first and last', () => {
    const result = parseKeyValueInput('name=Alice Smith\nemail=alice@example.com');
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Smith');
    expect(result.email).toBe('alice@example.com');
  });

  it('keeps a one-word name as the first name', () => {
    expect(parseKeyValueInput('name=Alice').firstName).toBe('Alice');
    expect(parseKeyValueInput('name=Alice').lastName).toBeUndefined();
  });

  it('parses key: value pairs', () => {
    const result = parseKeyValueInput('name: Bob\nphone: 555-1234');
    expect(result.firstName).toBe('Bob');
    expect(result.phone).toBe('555-1234');
  });

  it('maps legacy aliases onto the structured fields', () => {
    const result = parseKeyValueInput('company=Acme\nwebsite=https://acme.test\naddress=1 Market St\nzip=94105');
    expect(result.org).toBe('Acme');
    expect(result.url).toBe('https://acme.test');
    expect(result.street).toBe('1 Market St');
    expect(result.postalCode).toBe('94105');
  });

  it('ignores comment lines and unknown keys', () => {
    const result = parseKeyValueInput('# comment\nname=Alice\nfavourite-colour=blue');
    expect(result.firstName).toBe('Alice');
    expect(Object.keys(result)).toEqual(['firstName']);
  });
});

describe('buildVcard', () => {
  it('returns empty string when no field is filled', () => {
    expect(buildVcard({})).toBe('');
    expect(buildVcard({ firstName: '   ' })).toBe('');
  });

  it('wraps output in BEGIN/END markers', () => {
    const result = buildVcard({ firstName: 'Alice' });
    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('VERSION:3.0');
    expect(result).toContain('END:VCARD');
  });

  it('builds FN and N from the two name fields', () => {
    const result = buildVcard({ firstName: 'Alice', lastName: 'Smith' });
    expect(result).toContain('FN:Alice Smith');
    expect(result).toContain('N:Smith;Alice;;;');
  });

  it('emits one line per comma-separated email and phone', () => {
    const result = buildVcard({ email: 'a@x.test, b@x.test', phone: '555-1234, 555-9999' });
    expect(result.match(/EMAIL/g)).toHaveLength(2);
    expect(result.match(/TEL/g)).toHaveLength(2);
    expect(result).toContain('b@x.test');
    expect(result).toContain('555-9999');
  });

  it('builds a structured ADR from the address fields', () => {
    const result = buildVcard({ street: '1 Market St', city: 'SF', state: 'CA', postalCode: '94105', country: 'US' });
    expect(result).toContain('ADR;TYPE=HOME:;;1 Market St;SF;CA;94105;US');
  });

  it('omits ADR when no address field is filled', () => {
    expect(buildVcard({ firstName: 'Alice' })).not.toContain('ADR');
  });

  it('escapes commas, semicolons and newlines in values', () => {
    const result = buildVcard({ note: 'a,b;c\nd' });
    expect(result).toContain('NOTE:a\\,b\\;c\\nd');
  });

  it('folds lines longer than 75 characters', () => {
    const result = buildVcard({ note: 'x'.repeat(200) });
    expect(result.split('\r\n').every(line => line.length <= 75)).toBe(true);
  });

  it('is deterministic and adds REV only when asked', () => {
    expect(buildVcard({ firstName: 'Alice' })).toBe(buildVcard({ firstName: 'Alice' }));
    expect(buildVcard({ firstName: 'Alice' })).not.toContain('REV:');
    expect(buildVcard({ firstName: 'Alice' }, { rev: '20260101T000000Z' })).toContain('REV:20260101T000000Z');
  });
});

describe('isEmptyVcard', () => {
  it('is true for no fields and for whitespace-only fields', () => {
    expect(isEmptyVcard({})).toBe(true);
    expect(isEmptyVcard({ note: '  ' })).toBe(true);
  });

  it('is false once any field has content', () => {
    expect(isEmptyVcard({ note: 'hi' })).toBe(false);
  });
});

describe('vcardFilename', () => {
  it('slugifies the contact name', () => {
    expect(vcardFilename({ firstName: 'Alice', lastName: 'Smith' })).toBe('alice-smith');
  });

  it('falls back to the org, then to a default', () => {
    expect(vcardFilename({ org: 'Acme Corp' })).toBe('acme-corp');
    expect(vcardFilename({})).toBe('contact');
    expect(vcardFilename({ firstName: '!!!' })).toBe('contact');
  });
});

describe('generateVcard', () => {
  it('returns empty string for empty input', () => {
    expect(generateVcard('')).toBe('');
  });

  it('generates a vCard with BEGIN/END markers', () => {
    const result = generateVcard('name=Alice');
    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('END:VCARD');
    expect(result).toContain('VERSION:3.0');
  });

  it('includes FN field for name', () => {
    expect(generateVcard('name=Alice Smith')).toContain('FN:Alice Smith');
  });

  it('includes EMAIL, TEL, ORG and NOTE fields', () => {
    const result = generateVcard('name=Alice\nemail=alice@example.com\nphone=555-1234\norg=Acme Corp\nnote=Hello world');
    expect(result).toContain('alice@example.com');
    expect(result).toContain('TEL');
    expect(result).toContain('555-1234');
    expect(result).toContain('ORG:Acme Corp');
    expect(result).toContain('NOTE:Hello world');
  });

  it('still emits a valid skeleton when no key is recognised', () => {
    const result = generateVcard('favourite-colour=blue');
    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('END:VCARD');
  });
});

describe('vcardToFields', () => {
  it('returns nothing for input that is not a vCard', () => {
    expect(vcardToFields('name=Alice')).toEqual({});
  });

  it('reads names out of N', () => {
    const result = vcardToFields('BEGIN:VCARD\r\nVERSION:3.0\r\nN:Smith;Alice;;;\r\nEND:VCARD');
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Smith');
  });

  it('falls back to FN when there is no N', () => {
    const result = vcardToFields('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Alice Smith\r\nEND:VCARD');
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Smith');
  });

  it('reads the address back into separate fields', () => {
    const result = vcardToFields('BEGIN:VCARD\r\nADR;TYPE=HOME:;;1 Market St;SF;CA;94105;US\r\nEND:VCARD');
    expect(result).toMatchObject({ street: '1 Market St', city: 'SF', state: 'CA', postalCode: '94105', country: 'US' });
  });

  it('collects repeated emails and phones', () => {
    const result = vcardToFields(
      'BEGIN:VCARD\r\nEMAIL;TYPE=INTERNET:a@x.test\r\nEMAIL;TYPE=INTERNET:b@x.test\r\nTEL;TYPE=VOICE:555\r\nEND:VCARD'
    );
    expect(result.email).toBe('a@x.test, b@x.test');
    expect(result.phone).toBe('555');
  });

  it('unfolds long folded lines', () => {
    const note = 'y'.repeat(200);
    const built = buildVcard({ note });
    expect(vcardToFields(built).note).toBe(note);
  });

  it('round-trips every field through buildVcard', () => {
    const fields = {
      firstName: 'Alice', lastName: 'Smith', org: 'Acme Corp', title: 'Head of Engineering',
      email: 'alice@example.com', phone: '+1 555 0100', url: 'https://example.com',
      street: '1 Market St', city: 'SF', state: 'CA', postalCode: '94105', country: 'US',
      note: 'Met at the conference',
    };
    expect(vcardToFields(buildVcard(fields))).toEqual(fields);
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
    const result = parseVcard('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Alice Smith\r\nEND:VCARD');
    expect(result).toContain('name: Alice Smith');
  });

  it('parses EMAIL field', () => {
    const result = parseVcard('BEGIN:VCARD\r\nVERSION:3.0\r\nEMAIL;TYPE=INTERNET:alice@example.com\r\nEND:VCARD');
    expect(result).toContain('email: alice@example.com');
  });

  it('round-trips a vCard', () => {
    const parsed = parseVcard(generateVcard('name=Alice Smith\nemail=alice@example.com\nphone=555-1234\norg=Acme'));
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
