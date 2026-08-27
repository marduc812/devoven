import { parseOctal, parseSymbolic, parsePermissions } from '@/Components/Functions/UnixPermissionsTools/logic';

describe('parseOctal', () => {
  it('parses 755 correctly', () => {
    const r = parseOctal('755');
    expect(r.octal).toBe('755');
    expect(r.symbolic).toBe('rwxr-xr-x');
    expect(r.owner).toEqual({ read: true, write: true, execute: true });
    expect(r.group).toEqual({ read: true, write: false, execute: true });
    expect(r.other).toEqual({ read: true, write: false, execute: true });
  });

  it('parses 644 correctly', () => {
    const r = parseOctal('644');
    expect(r.symbolic).toBe('rw-r--r--');
    expect(r.owner).toEqual({ read: true, write: true, execute: false });
    expect(r.group).toEqual({ read: true, write: false, execute: false });
    expect(r.other).toEqual({ read: true, write: false, execute: false });
  });

  it('parses 777 correctly', () => {
    const r = parseOctal('777');
    expect(r.symbolic).toBe('rwxrwxrwx');
  });

  it('parses 000 correctly', () => {
    const r = parseOctal('000');
    expect(r.symbolic).toBe('---------');
  });

  it('parses 600 correctly', () => {
    const r = parseOctal('600');
    expect(r.symbolic).toBe('rw-------');
  });

  it('handles leading 0 (0755)', () => {
    const r = parseOctal('0755');
    expect(r.octal).toBe('755');
    expect(r.symbolic).toBe('rwxr-xr-x');
  });

  it('throws on invalid octal digit', () => {
    expect(() => parseOctal('89')).toThrow();
  });

  it('throws on non-octal input', () => {
    expect(() => parseOctal('abc')).toThrow();
  });
});

describe('parseSymbolic', () => {
  it('parses rwxr-xr-x correctly', () => {
    const r = parseSymbolic('rwxr-xr-x');
    expect(r.octal).toBe('755');
    expect(r.symbolic).toBe('rwxr-xr-x');
  });

  it('parses rw-r--r-- correctly', () => {
    const r = parseSymbolic('rw-r--r--');
    expect(r.octal).toBe('644');
  });

  it('parses rwxrwxrwx correctly', () => {
    const r = parseSymbolic('rwxrwxrwx');
    expect(r.octal).toBe('777');
  });

  it('parses --------- correctly', () => {
    const r = parseSymbolic('---------');
    expect(r.octal).toBe('000');
  });

  it('handles leading file type indicator (drwxr-xr-x)', () => {
    const r = parseSymbolic('drwxr-xr-x');
    expect(r.octal).toBe('755');
  });

  it('throws on invalid symbolic input', () => {
    expect(() => parseSymbolic('invalid')).toThrow();
    expect(() => parseSymbolic('rwxrwxrwxrwx')).toThrow();
  });
});

describe('parsePermissions', () => {
  it('auto-detects octal', () => {
    const r = parsePermissions('755');
    expect(r.symbolic).toBe('rwxr-xr-x');
  });

  it('auto-detects symbolic', () => {
    const r = parsePermissions('rwxr-xr-x');
    expect(r.octal).toBe('755');
  });

  it('throws on empty input', () => {
    expect(() => parsePermissions('')).toThrow('Please enter');
  });

  it('throws on unrecognized format', () => {
    expect(() => parsePermissions('abc123xyz')).toThrow('Unrecognized format');
  });
});
