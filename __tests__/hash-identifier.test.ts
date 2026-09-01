import {
  formatIdentifyReport,
  identifyHash,
  identifyLines,
  modeLabel,
} from '@/Components/Functions/HashIdentifierTools/logic';
import { prototypes } from '@/Components/Functions/HashIdentifierTools/hashes';

const names = (hash: string) => identifyHash(hash).map((c) => c.name);

describe('identifyHash', () => {
  it('names MD5 first for a 32-character hex string', () => {
    const result = names('8743b52063cd84097a65d1633f5c74f5');
    expect(result[0]).toBe('MD5');
    expect(result).toContain('MD4');
    expect(result).toContain('NTLM');
  });

  it('reports the hashcat mode for MD5', () => {
    expect(identifyHash('8743b52063cd84097a65d1633f5c74f5')[0].hashcat).toBe(0);
  });

  it('floats popular types above the rest', () => {
    // Upstream order for a bcrypt hash is Blowfish(OpenBSD), Woltlab, bcrypt.
    // bcrypt is in the popular set, so it has to come first.
    const result = names('$2a$05$LhayLxezLhK1LhWvKxCyLOj0j1u.Kj0jZ0pEmm134uzrQlFvQJLF6');
    expect(result[0]).toBe('bcrypt');
    expect(result).toContain('Blowfish(OpenBSD)');
  });

  it('identifies a Kerberos 5 TGS-REP etype 23 ticket', () => {
    const hash =
      '$krb5tgs$23$*user$realm$test/spn*$63386d22d359fe42230300d56852c9eb$891ad31d09ab89c6b3b8c5e5de6c06a7f49fd559d7a9a3c32576c8fedf705376cea582ab5938f7fc8bc741acf05c5990741b36ef4311fe3562a41b70a4ec6ecba849905f2385bb3799d92499909658c7287c49160276bca0006c350b0db4fd387adc27c01e9e9ad0c20ed53a7e6356dee2452e35eca2a6a1d1432796fc5c19d068978df74d3d0baf35c77de12456bf1144b6a750d11f55805f5a16ece2975246e2d026dce997fba34ac8757312e9e4e6272de35e20d52fb668c5ed';
    const result = identifyHash(hash);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Kerberos 5 TGS-REP etype 23');
    expect(result[0].hashcat).toBe(13100);
  });

  it('identifies a SHA-512 crypt shadow entry', () => {
    expect(
      names('$6$52450745$k5ka2p8bFuSmoVT1tzOyyuaREkkKBcCNqoDKzYiJL9RaE8yMnPgh2XzzF0NDrUhgrcLwg78xs1w5pJiypEdFX/'),
    ).toContain('SHA-512 Crypt');
  });

  it('leaves hashcat null when no mode exists', () => {
    const adler = identifyHash('deadbeef').find((c) => c.name === 'Adler-32');
    expect(adler).toBeDefined();
    expect(adler!.hashcat).toBeNull();
  });

  it('links to the DevOven generator when the site has one', () => {
    const md5 = identifyHash('8743b52063cd84097a65d1633f5c74f5')[0];
    expect(md5.tool).toBe('/hashing/md5');
  });

  it('anchors patterns so junk around a hash does not match', () => {
    expect(identifyHash('user:8743b52063cd84097a65d1633f5c74f5')).not.toContainEqual(
      expect.objectContaining({ name: 'MD5' }),
    );
  });

  it('trims surrounding whitespace', () => {
    expect(names('  8743b52063cd84097a65d1633f5c74f5\t')[0]).toBe('MD5');
  });

  it('returns nothing for an empty or unrecognised input', () => {
    expect(identifyHash('')).toEqual([]);
    expect(identifyHash('   ')).toEqual([]);
    expect(identifyHash('not a hash at all!!')).toEqual([]);
  });

  it('never lists the same type twice', () => {
    const result = names('8743b52063cd84097a65d1633f5c74f5');
    expect(new Set(result).size).toBe(result.length);
  });
});

describe('identifyLines', () => {
  it('identifies each non-empty line separately', () => {
    const results = identifyLines('8743b52063cd84097a65d1633f5c74f5\n\n  \ndeadbeef\n');
    expect(results).toHaveLength(2);
    expect(results[0].hash).toBe('8743b52063cd84097a65d1633f5c74f5');
    expect(results[0].candidates[0].name).toBe('MD5');
    expect(results[1].hash).toBe('deadbeef');
  });
});

describe('modeLabel', () => {
  it('prints the bare mode number', () => {
    expect(modeLabel(1000)).toBe('1000');
  });

  it('prints a dash when hashcat has no mode', () => {
    expect(modeLabel(null)).toBe('-');
  });
});

describe('formatIdentifyReport', () => {
  it('lists the hash and its candidates in aligned mode/type columns', () => {
    const report = formatIdentifyReport('8743b52063cd84097a65d1633f5c74f5');
    const lines = report.split('\n');
    expect(lines[0]).toBe('8743b52063cd84097a65d1633f5c74f5');
    expect(lines[1]).toBe('  0     MD5');
    expect(lines[2]).toBe('  900   MD4');
  });

  it('keeps the type column aligned when a mode is four digits wide', () => {
    const report = formatIdentifyReport('8743b52063cd84097a65d1633f5c74f5');
    const rows = report.split('\n').slice(1);
    const columns = rows.map((row) => row.indexOf(row.trim().split(/\s{2,}/)[1]));
    expect(new Set(columns).size).toBe(1);
  });

  it('says so when nothing matches', () => {
    expect(formatIdentifyReport('not a hash at all!!')).toContain('no matching hash type found');
  });

  it('marks types hashcat cannot crack with a dash', () => {
    // deadbeef's widest mode is CRC-32's 11500, so the column is five wide.
    expect(formatIdentifyReport('deadbeef')).toContain('  -      Adler-32');
    expect(formatIdentifyReport('deadbeef')).toContain('  11500  CRC-32');
  });

  it('separates each hash with a blank line', () => {
    const report = formatIdentifyReport('8743b52063cd84097a65d1633f5c74f5\ndeadbeef');
    expect(report).toContain('\n\ndeadbeef\n');
  });

  it('throws on empty input', () => {
    expect(() => formatIdentifyReport('   ')).toThrow('Nothing to identify');
  });
});

describe('prototype database', () => {
  it('carries every upstream prototype', () => {
    expect(prototypes).toHaveLength(213);
    expect(prototypes.reduce((n, p) => n + p.modes.length, 0)).toBe(388);
  });

  it('anchors every pattern at the start of the string', () => {
    for (const prototype of prototypes) {
      expect(prototype.regex.source.startsWith('^')).toBe(true);
    }
  });

  it('uses no global regexes, which would carry lastIndex between calls', () => {
    for (const prototype of prototypes) {
      expect(prototype.regex.global).toBe(false);
    }
  });
});
