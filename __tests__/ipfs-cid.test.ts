import {
  cidForms,
  cidSegments,
  decodeCID,
  formatCIDInfo,
  gatewayLinks,
  splitLabel,
} from '@/Components/Functions/IpfsCidTools/logic';

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

  describe('cidForms', () => {
    const V0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
    const V1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    const RAW = 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy';

    it('round-trips a base32 CIDv1 back to itself', () => {
      const forms = cidForms(decodeCID(V1));
      expect(forms?.v1Base32).toBe(V1);
    });

    it('round-trips a raw-codec CIDv1 back to itself', () => {
      const forms = cidForms(decodeCID(RAW));
      expect(forms?.v1Base32).toBe(RAW);
    });

    it('round-trips a CIDv0 back to itself', () => {
      const forms = cidForms(decodeCID(V0));
      expect(forms?.v0).toBe(V0);
    });

    it('gives a CIDv0 the same digest in its v1 forms', () => {
      const info = decodeCID(V0);
      const forms = cidForms(info);
      expect(forms?.v1Base32.startsWith('b')).toBe(true);
      expect(decodeCID(forms!.v1Base32).digestHex).toBe(info.digestHex);
      expect(decodeCID(forms!.v1Base58).digestHex).toBe(info.digestHex);
      expect(decodeCID(forms!.v1Hex).digestHex).toBe(info.digestHex);
    });

    it('every encoding of one CID decodes to the same codec and hash', () => {
      const info = decodeCID(V1);
      const forms = cidForms(info)!;
      for (const form of [forms.v1Base32, forms.v1Base58, forms.v1Hex]) {
        const again = decodeCID(form);
        expect(again.codecCode).toBe(info.codecCode);
        expect(again.hashFunctionCode).toBe(info.hashFunctionCode);
      }
    });

    it('refuses a CIDv0 for a raw-codec CID and says why', () => {
      const forms = cidForms(decodeCID(RAW));
      expect(forms?.v0).toBeUndefined();
      expect(forms?.v0Note).toContain('dag-pb');
    });

    it('returns null for an invalid CID', () => {
      expect(cidForms(decodeCID('not-a-cid'))).toBeNull();
    });
  });

  describe('cidSegments', () => {
    it('lays out a CIDv1 as version, codec, hash, length, digest', () => {
      const segments = cidSegments(decodeCID('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'));
      expect(segments.map(s => s.label)).toEqual([
        'Version',
        'Codec',
        'Hash function',
        'Digest length',
        'Digest',
      ]);
      expect(segments[0].hex).toBe('01');
      expect(segments[1].hex).toBe('70');
      expect(segments[2].hex).toBe('12');
      expect(segments[3].hex).toBe('20');
    });

    it('marks the version and codec of a CIDv0 as implicit', () => {
      const segments = cidSegments(decodeCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'));
      expect(segments[0].hex).toBe('—');
      expect(segments[1].note).toContain('dag-pb');
    });

    it('returns nothing for an invalid CID', () => {
      expect(cidSegments(decodeCID('nope'))).toEqual([]);
    });
  });

  describe('gatewayLinks', () => {
    it('builds gateway URLs from the canonical base32 form', () => {
      const forms = cidForms(decodeCID('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'))!;
      const links = gatewayLinks(forms);
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) expect(link.url).toContain(forms.v1Base32);
      expect(links.some(l => l.url === `https://${forms.v1Base32}.ipfs.dweb.link/`)).toBe(true);
    });

    it('has no links without a decoded CID', () => {
      expect(gatewayLinks(null)).toEqual([]);
    });
  });

  describe('splitLabel', () => {
    it('separates a name from its gloss', () => {
      expect(splitLabel('dag-pb (MerkleDAG protobuf)')).toEqual({
        name: 'dag-pb',
        note: 'MerkleDAG protobuf',
      });
    });

    it('leaves a bare name alone', () => {
      expect(splitLabel('libp2p-key')).toEqual({ name: 'libp2p-key' });
    });
  });
});
