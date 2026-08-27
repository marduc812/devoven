import { calculateFees, formatFeeResult, TX_TYPES, type TxType } from '@/Components/Functions/TxFeeCalcTools/logic';

describe('Transaction Fee Calculator', () => {
  describe('TX_TYPES', () => {
    it('has at least 7 predefined types', () => {
      expect(TX_TYPES.length).toBeGreaterThanOrEqual(7);
    });

    it('includes eth-transfer with 21000 gas', () => {
      const t = TX_TYPES.find(t => t.id === 'eth-transfer');
      expect(t).toBeDefined();
      expect(t!.chain).toBe('ETH');
      expect(t!.gasOrVbytes).toBe(21000);
    });

    it('includes btc-p2pkh with 226 vbytes', () => {
      const t = TX_TYPES.find(t => t.id === 'btc-p2pkh');
      expect(t).toBeDefined();
      expect(t!.chain).toBe('BTC');
      expect(t!.gasOrVbytes).toBe(226);
    });

    it('includes btc-p2wpkh as SegWit option', () => {
      const t = TX_TYPES.find(t => t.id === 'btc-p2wpkh');
      expect(t).toBeDefined();
      expect(t!.gasOrVbytes).toBe(141);
    });
  });

  describe('calculateFees', () => {
    it('calculates ETH transfer fees at 4 speed tiers', () => {
      const result = calculateFees('eth-transfer', 21000);
      expect(result.chain).toBe('ETH');
      expect(result.rows.length).toBe(4);
    });

    it('has Slow, Standard, Fast, Rapid for ETH', () => {
      const result = calculateFees('eth-transfer', 21000);
      const speeds = result.rows.map(r => r.speed);
      expect(speeds).toContain('Slow');
      expect(speeds).toContain('Standard');
      expect(speeds).toContain('Fast');
      expect(speeds).toContain('Rapid');
    });

    it('calculates BTC P2PKH fees at 4 speed tiers', () => {
      const result = calculateFees('btc-p2pkh', 226);
      expect(result.chain).toBe('BTC');
      expect(result.rows.length).toBe(4);
    });

    it('BTC fees contain "sats" or "BTC"', () => {
      const result = calculateFees('btc-p2pkh', 226);
      for (const row of result.rows) {
        const hasSats = row.fee.includes('sats') || row.fee.includes('BTC');
        expect(hasSats).toBe(true);
      }
    });

    it('ETH fees contain "ETH" or "μETH"', () => {
      const result = calculateFees('eth-transfer', 21000);
      for (const row of result.rows) {
        const hasEth = row.fee.includes('ETH') || row.fee.includes('μETH');
        expect(hasEth).toBe(true);
      }
    });

    it('higher speed tier = higher fee for ETH', () => {
      const result = calculateFees('eth-transfer', 21000);
      const gweis = result.rows.map(r => parseFloat(r.rate));
      // Gwei values should increase
      for (let i = 1; i < gweis.length; i++) {
        expect(gweis[i]).toBeGreaterThan(gweis[i - 1]);
      }
    });

    it('calculates custom ETH gas', () => {
      const result = calculateFees('custom-eth', 50000);
      expect(result.sizeLabel).toContain('50,000');
    });

    it('calculates custom BTC vbytes', () => {
      const result = calculateFees('custom-btc', 400);
      expect(result.sizeLabel).toContain('400');
    });
  });

  describe('formatFeeResult', () => {
    it('includes transaction name and size', () => {
      const result = calculateFees('eth-transfer', 21000);
      const formatted = formatFeeResult(result);
      expect(formatted).toContain('Simple ETH Transfer');
      expect(formatted).toContain('21,000');
    });

    it('includes all speed tiers in output', () => {
      const result = calculateFees('btc-p2pkh', 226);
      const formatted = formatFeeResult(result);
      expect(formatted).toContain('Low Priority');
      expect(formatted).toContain('Standard');
    });
  });
});
