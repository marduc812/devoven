import { toChecksumAddress } from 'web3-utils';
import { toEIP55Checksum } from '@/Components/Functions/EthChecksumTools/logic';

// The reference vectors from EIP-55 itself, in their checksummed form.
const VECTORS = [
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
  '0x52908400098527886E0F7030069857D2E4169EE7',
  '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
  '0x27b1fdb04752bbc536007a920d24acb045561c26',
];

describe('Ethereum EIP-55 Checksum', () => {
  describe('toEIP55Checksum', () => {
    it('handles empty input', () => {
      const result = toEIP55Checksum('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects non-hex characters', () => {
      expect(toEIP55Checksum('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG').valid).toBe(false);
    });

    it('rejects wrong length', () => {
      expect(toEIP55Checksum('0x1234').valid).toBe(false);
    });

    it.each(VECTORS)('matches the EIP-55 reference vector %s', expected => {
      const result = toEIP55Checksum(expected.toLowerCase());
      expect(result.valid).toBe(true);
      expect(result.checksummed).toBe(expected);
    });

    it('reaches the same answer from any input casing', () => {
      const expected = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
      for (const form of [expected, expected.toLowerCase(), '0x' + expected.slice(2).toUpperCase()]) {
        expect(toEIP55Checksum(form).checksummed).toBe(expected);
      }
    });

    it('accepts an address without the 0x prefix', () => {
      const result = toEIP55Checksum('fb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      expect(result.checksummed).toBe('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
    });

    it('trims surrounding whitespace', () => {
      const result = toEIP55Checksum('  0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359\n');
      expect(result.valid).toBe(true);
      expect(result.checksummed).toBe('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
    });

    it('classifies an all-lowercase address as carrying no checksum', () => {
      const result = toEIP55Checksum('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      expect(result.form).toBe('lowercase');
      expect(result.normalized).toBe('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359');
    });

    it('classifies an all-uppercase address as carrying no checksum', () => {
      expect(toEIP55Checksum('0xFB6916095CA1DF60BB79CE92CE3EA74C37C5D359').form).toBe('uppercase');
    });

    it('classifies a correctly cased address as checksummed', () => {
      const result = toEIP55Checksum('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
      expect(result.form).toBe('checksummed');
      expect(result.mismatches).toEqual([]);
    });

    it('flags mixed case that disagrees with the checksum', () => {
      // 0x5aAeb6053F3E94… with the F at body index 8 lowercased.
      const result = toEIP55Checksum('0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed');
      expect(result.form).toBe('mismatch');
      expect(result.mismatches).toEqual([9]);
    });

    it('counts the letters the checksum uppercases', () => {
      const result = toEIP55Checksum('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      const body = result.checksummed!.slice(2);
      expect(result.letterCount).toBe(body.replace(/[^a-fA-F]/g, '').length);
      expect(result.upperCount).toBe(body.replace(/[^A-F]/g, '').length);
    });

    it('agrees with web3-utils across random addresses', () => {
      const hex = '0123456789abcdef';
      for (let n = 0; n < 200; n++) {
        let addr = '0x';
        for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
        expect(toEIP55Checksum(addr).checksummed).toBe(toChecksumAddress(addr));
      }
    });

    it('leaves an address with no hex letters unchanged', () => {
      const digits = '0x' + '1234567890'.repeat(4);
      const result = toEIP55Checksum(digits);
      expect(result.checksummed).toBe(digits);
      expect(result.letterCount).toBe(0);
      expect(result.form).toBe('checksummed');
    });
  });
});
