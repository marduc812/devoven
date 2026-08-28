import { toEIP55Checksum, formatEthChecksumResult } from '@/Components/Functions/EthChecksumTools/logic';

describe('Ethereum EIP-55 Checksum', () => {
  describe('toEIP55Checksum', () => {
    it('handles empty input', () => {
      const result = toEIP55Checksum('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects non-hex characters', () => {
      const result = toEIP55Checksum('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG');
      expect(result.valid).toBe(false);
    });

    it('rejects wrong length', () => {
      const result = toEIP55Checksum('0x1234');
      expect(result.valid).toBe(false);
    });

    it('accepts all-lowercase address', () => {
      const result = toEIP55Checksum('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      expect(result.valid).toBe(true);
      expect(result.checksummed).toBeDefined();
      expect(result.checksummed!.startsWith('0x')).toBe(true);
      expect(result.checksummed!.length).toBe(42);
    });

    it('accepts address without 0x prefix', () => {
      const result = toEIP55Checksum('fb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      expect(result.valid).toBe(true);
      expect(result.checksummed).toBeDefined();
    });

    it('produces consistent checksum', () => {
      const addr = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
      const r1 = toEIP55Checksum(addr);
      const r2 = toEIP55Checksum(addr.toUpperCase().replace('0X', '0x'));
      expect(r1.checksummed).toBe(r2.checksummed);
    });

    it('detects all-lowercase input', () => {
      const result = toEIP55Checksum('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      expect(result.isAllLower).toBe(true);
    });

    it('detects already-checksummed address', () => {
      // First compute checksum, then verify it detects as already-checksummed
      const addr = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
      const r1 = toEIP55Checksum(addr);
      if (r1.checksummed) {
        const r2 = toEIP55Checksum(r1.checksummed);
        expect(r2.isAlreadyChecksummed).toBe(true);
      }
    });

    it('checksummed output contains only hex chars and 0x prefix', () => {
      const result = toEIP55Checksum('0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae');
      expect(result.valid).toBe(true);
      expect(result.checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  describe('formatEthChecksumResult', () => {
    it('returns error for invalid input', () => {
      const result = toEIP55Checksum('bad');
      const formatted = formatEthChecksumResult(result);
      expect(formatted).toContain('Error');
    });

    it('returns checksummed address for valid input', () => {
      const result = toEIP55Checksum('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359');
      const formatted = formatEthChecksumResult(result);
      expect(formatted).toContain('EIP-55');
      expect(formatted).toContain('0x');
    });
  });
});
