import { validateBitcoinAddress, formatBitcoinResult } from '@/Components/Functions/BitcoinAddrTools/logic';

describe('Bitcoin Address Validator', () => {
  describe('P2PKH addresses (start with 1)', () => {
    it('validates Satoshi genesis block address', () => {
      // The genesis block coinbase address - widely known to be valid
      const result = validateBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(result.valid).toBe(true);
      expect(result.type).toContain('P2PKH');
      expect(result.network).toBe('Mainnet');
      expect(result.encoding).toBe('Base58Check');
      expect(result.checksumValid).toBe(true);
    });

    it('validates another known P2PKH address', () => {
      // FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF — valid P2PKH
      const result = validateBitcoinAddress('1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF');
      expect(result.valid).toBe(true);
      expect(result.type).toContain('P2PKH');
    });

    it('returns invalid for a corrupted address', () => {
      // Flip a character to break checksum
      const result = validateBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNZ');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for wrong length', () => {
      const result = validateBitcoinAddress('1BpEi6DfDAUFd153');
      expect(result.valid).toBe(false);
    });
  });

  describe('P2SH addresses (start with 3)', () => {
    it('validates a P2SH address', () => {
      const result = validateBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
      expect(result.valid).toBe(true);
      expect(result.type).toContain('P2SH');
      expect(result.network).toBe('Mainnet');
    });
  });

  describe('Bech32 addresses (bc1)', () => {
    it('validates a bc1 address format detection', () => {
      // We test that bc1 addresses are detected as Bech32
      const result = validateBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(result.encoding).toBe('Bech32');
      expect(result.network).toBe('Mainnet');
    });

    it('rejects invalid bech32 with bad checksum', () => {
      const result = validateBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kzzzzz');
      expect(result.checksumValid).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty input', () => {
      const result = validateBitcoinAddress('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('handles completely invalid input', () => {
      const result = validateBitcoinAddress('not-a-bitcoin-address');
      expect(result.valid).toBe(false);
    });

    it('handles invalid base58 characters', () => {
      const result = validateBitcoinAddress('1InvalidOCharacterl0InAddress');
      // 0, O, I, l are not in base58
      expect(result.valid).toBe(false);
    });
  });

  describe('formatBitcoinResult', () => {
    it('returns details for valid address', () => {
      const result = validateBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
      const formatted = formatBitcoinResult(result);
      expect(formatted).toContain('Base58Check');
    });

    it('returns error string for invalid address', () => {
      const result = validateBitcoinAddress('');
      const formatted = formatBitcoinResult(result);
      expect(formatted).toContain('Invalid');
    });
  });
});
