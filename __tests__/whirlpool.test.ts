import { whirlpool, whirlpoolBytes } from '../Components/Functions/WhirlpoolTools/logic';

describe('whirlpool', () => {
  // The ISO/IEC 10118-3 and NESSIE vector set.
  const VECTORS: [string, string][] = [
    [
      '',
      '19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a7' +
        '3e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3',
    ],
    [
      'abc',
      '4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c' +
        '7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5',
    ],
    [
      'message digest',
      '378c84a4126e2dc6e56dcc7458377aac838d00032230f53ce1f5700c0ffb4d3b' +
        '8421557659ef55c106b4b52ac5a4aaa692ed920052838f3362e86dbd37a8903e',
    ],
    [
      'abcdefghijklmnopqrstuvwxyz',
      'f1d754662636ffe92c82ebb9212a484a8d38631ead4238f5442ee13b8054e41b' +
        '08bf2a9251c30b6a0b8aae86177ab4a6f68f673e7207865d5d9819a3dba4eb3b',
    ],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'dc37e008cf9ee69bf11f00ed9aba26901dd7c28cdec066cc6af42e40f82f3a1e' +
        '08eba26629129d8fb7cb57211b9281a65517cc879d7b962142c65f5a7af01467',
    ],
    [
      '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
      '466ef18babb0154d25b9d38a6414f5c08784372bccb204d6549c4afadb601429' +
        '4d5bd8df2a6c44e538cd047b2681a51a2c60481e88c5a20b2c2a80cf3a9a083b',
    ],
    // 43 bytes, which lands in the padding case several other implementations
    // get wrong (message length 32..55 mod 64).
    [
      'The quick brown fox jumps over the lazy dog',
      'b97de512e91e3828b40d2b0fdce9ceb3c4a71f9bea8d88e75c4fa854df36725f' +
        'd2b52eb6544edcacd6f8beddfea403cb55ae31f03ad62a5ef54e42ee82c3fb35',
    ],
    [
      'The quick brown fox jumps over the lazy eog',
      'c27ba124205f72e6847f3e19834f925cc666d0974167af915bb462420ed40cc5' +
        '0900d85a1f923219d832357750492d5c143011a76988344c2635e69d06f2d38c',
    ],
  ];

  it.each(VECTORS)('matches the reference digest for %j', (input, expected) => {
    expect(whirlpool(input)).toBe(expected);
  });

  it('produces 64 bytes', () => {
    expect(whirlpoolBytes(new Uint8Array(0))).toHaveLength(64);
  });

  it('changes for every message length across a block boundary', () => {
    // Every length from 0 to 200 must give a distinct digest; a padding bug
    // collapses neighbouring lengths onto the same value.
    const seen = new Set<string>();
    for (let length = 0; length <= 200; length++) seen.add(whirlpool('a'.repeat(length)));
    expect(seen.size).toBe(201);
  });
});
