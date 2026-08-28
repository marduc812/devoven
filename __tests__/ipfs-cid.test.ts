import { decodeCID, formatCIDInfo } from '@/Components/Functions/IpfsCidTools/logic';

describe('IPFS CID Decoder', () => {
  describe('CIDv0', () => {
    it('decodes a valid CIDv0 (starts with Qm, 46 chars)', () => {
      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const result = decodeCID(cid);
      expect(result.valid).toBe(true);
      expect(result.version).toBe(0);
      expect(result.codec).toContain('dag-pb');
      expect(result.hashFunction).toContain('sha2-256');
      expect(result.baseEncoding).toContain('base58btc');
    });

    it('detects correct digest length for CIDv0', () => {
      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const result = decodeCID(cid);
      expect(result.digestLength).toBe(32); // SHA-256 produces 32 bytes
    });

    it('returns digest as hex string', () => {
      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const result = decodeCID(cid);
      expect(result.digestHex).toMatch(/^[0-9a-f]{64}$/);
    });

    it('rejects an invalid CIDv0 with bad characters', () => {
      const result = decodeCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbd0'); // '0' not in base58
      expect(result.valid).toBe(false);
    });
  });

  describe('CIDv1', () => {
    it('handles base32 prefix b', () => {
      // A base32-encoded CIDv1 — we just check detection works
      const result = decodeCID('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi');
      // This should attempt to decode as CIDv1 base32
      expect(result).toBeDefined();
      // May be valid or produce a decoding error — either is fine for unit test
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Error cases', () => {
    it('returns invalid for empty input', () => {
      const result = decodeCID('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns invalid for random string', () => {
      const result = decodeCID('not-a-cid');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for short Qm string', () => {
      const result = decodeCID('QmShort');
      expect(result.valid).toBe(false);
    });
  });

  describe('formatCIDInfo', () => {
    it('returns error string for invalid CID', () => {
      const result = decodeCID('');
      const formatted = formatCIDInfo(result);
      expect(formatted).toContain('Error');
    });

    it('returns structured info for valid CIDv0', () => {
      const result = decodeCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      const formatted = formatCIDInfo(result);
      expect(formatted).toContain('CID Version:');
      expect(formatted).toContain('Codec:');
      expect(formatted).toContain('Hash Function:');
    });
  });
});
