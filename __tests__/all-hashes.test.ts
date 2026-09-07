import CryptoJS from 'crypto-js';
import {
  FAMILY_ORDER,
  filterHashRows,
  formatAllHashes,
  generateAllHashes,
  groupByFamily,
} from '@/Components/Functions/AllHashesTools/logic';
import { OPERATION_MAP } from '@/lib/blocks/registry';

const rows = generateAllHashes('abc');
const digest = (id: string) => rows.find((row) => row.id === id)?.digest;

// Published vectors for "abc", one per family, so a wrong wiring cannot hide
// behind a self-consistent round trip.
const VECTORS: Record<string, string> = {
  md4: 'a448017aaf21d8525fc10ae87aa6729d',
  md5: '900150983cd24fb0d6963f7d28e17f72',
  ntlm: 'e0fba38268d0ec66ef1cb452d5885e53',
  sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
  sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  sha512:
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  'sha3-256': '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
  keccak256: '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
  'blake2b-512':
    'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
  'blake2s-256': '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
  'blake3-256': '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85',
  ripemd160: '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc',
  sm3: '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0',
  crc32: '352441c2',
  adler32: '024d0127',
  'fnv1a-32': '1a47e90b',
};

describe('generateAllHashes', () => {
  it.each(Object.entries(VECTORS))('matches the published vector for %s', (id, expected) => {
    expect(digest(id)).toBe(expected);
  });

  it('produces a digest of exactly the width it claims', () => {
    rows.forEach((row) => {
      expect(row.digest).toMatch(/^[0-9a-f]+$/);
      expect(row.digest.length).toBe(row.bits / 4);
    });
  });

  it('gives every row a unique id and a note', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    rows.forEach((row) => expect(row.note.trim()).not.toBe(''));
  });

  it('covers every declared family', () => {
    expect(new Set(rows.map((r) => r.family))).toEqual(new Set(FAMILY_ORDER));
  });

  it('gives the checksums a decimal reading and the real hashes none', () => {
    rows.forEach((row) => {
      if (row.family === 'checksum') {
        expect(row.decimal).toMatch(/^\d+$/);
        expect(parseInt(row.digest, 16)).toBe(Number(row.decimal));
      } else {
        expect(row.decimal).toBeUndefined();
      }
    });
  });

  it('uppercases every digest on request, changing nothing else', () => {
    const upper = generateAllHashes('abc', { case: 'upper' });
    expect(upper.map((r) => r.digest)).toEqual(rows.map((r) => r.digest.toUpperCase()));
    expect(upper.map((r) => r.id)).toEqual(rows.map((r) => r.id));
  });

  it('hashes the empty string rather than bailing out', () => {
    const empty = generateAllHashes('');
    expect(empty).toHaveLength(rows.length);
    expect(empty.find((r) => r.id === 'md5')?.digest).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('reads UTF-8 bytes, not code units', () => {
    // The € is three bytes; a truncating implementation would agree with '¬'.
    expect(digestOf('€', 'sha256')).toBe(CryptoJS.SHA256('€').toString());
    expect(digestOf('€', 'sha256')).not.toBe(digestOf('¬', 'sha256'));
  });
});

const digestOf = (input: string, id: string) =>
  generateAllHashes(input).find((row) => row.id === id)?.digest;

describe('filtering and grouping', () => {
  it('keeps everything for an empty query', () => {
    expect(filterHashRows(rows, '   ')).toHaveLength(rows.length);
  });

  it('matches on name, family and digest', () => {
    expect(filterHashRows(rows, 'blake').map((r) => r.id)).toEqual([
      'blake2b-256',
      'blake2b-512',
      'blake2s-256',
      'blake3-256',
    ]);
    expect(filterHashRows(rows, 'checksums').every((r) => r.family === 'checksum')).toBe(true);
    expect(filterHashRows(rows, VECTORS.md5).map((r) => r.id)).toEqual(['md5']);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(filterHashRows(rows, 'argon2')).toEqual([]);
  });

  it('groups in family order and drops empty families', () => {
    expect(groupByFamily(rows).map((g) => g.family)).toEqual(FAMILY_ORDER);
    expect(groupByFamily(filterHashRows(rows, 'blake')).map((g) => g.family)).toEqual(['blake']);
  });
});

describe('formatAllHashes', () => {
  it('writes one aligned line per row under a family heading', () => {
    const report = formatAllHashes(rows);
    expect(report).toContain('=== MD family ===');
    expect(report).toContain(`MD5${' '.repeat(17)}  ${VECTORS.md5}`);
    // Every row appears, and nothing else does.
    expect(report.split('\n').filter((l) => l && !l.startsWith('==='))).toHaveLength(rows.length);
  });

  it('survives an empty row list', () => {
    expect(formatAllHashes([])).toBe('');
  });
});

describe('blocks registry', () => {
  const op = OPERATION_MAP['all-hashes'];

  it('is registered as a terminal report', () => {
    expect(op).toBeDefined();
    expect(op.terminal).toBe(true);
    expect(op.category).toBe('hashing');
  });

  it('returns the same report the page shows', () => {
    const params = Object.fromEntries(op.params.map((p) => [p.id, p.default]));
    expect(op.fn('abc', params)).toBe(formatAllHashes(rows));
    expect(op.fn('abc', { ...params, case: 'upper' })).toBe(
      formatAllHashes(generateAllHashes('abc', { case: 'upper' })),
    );
  });
});
