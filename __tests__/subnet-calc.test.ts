import { calcSubnet } from '@/Components/Functions/SubnetCalcTools/logic';

describe('calcSubnet', () => {
  it('throws on empty input', () => {
    expect(() => calcSubnet('')).toThrow('Please enter');
  });

  it('throws on missing prefix', () => {
    expect(() => calcSubnet('192.168.1.0')).toThrow('Invalid CIDR');
  });

  it('throws on invalid prefix', () => {
    expect(() => calcSubnet('192.168.1.0/33')).toThrow('Prefix length must be between');
  });

  it('calculates /24 correctly', () => {
    const r = calcSubnet('192.168.1.0/24');
    expect(r.network).toBe('192.168.1.0');
    expect(r.broadcast).toBe('192.168.1.255');
    expect(r.subnetMask).toBe('255.255.255.0');
    expect(r.wildcardMask).toBe('0.0.0.255');
    expect(r.firstHost).toBe('192.168.1.1');
    expect(r.lastHost).toBe('192.168.1.254');
    expect(r.usableHosts).toBe(254);
    expect(r.totalHosts).toBe(256);
    expect(r.prefixLength).toBe(24);
  });

  it('calculates /16 correctly', () => {
    const r = calcSubnet('10.0.0.0/16');
    expect(r.network).toBe('10.0.0.0');
    expect(r.broadcast).toBe('10.0.255.255');
    expect(r.subnetMask).toBe('255.255.0.0');
    expect(r.usableHosts).toBe(65534);
  });

  it('handles /32 (single host)', () => {
    const r = calcSubnet('192.168.1.1/32');
    expect(r.network).toBe('192.168.1.1');
    expect(r.broadcast).toBe('192.168.1.1');
    expect(r.usableHosts).toBe(1);
  });

  it('handles /0 (all IPs)', () => {
    const r = calcSubnet('0.0.0.0/0');
    expect(r.network).toBe('0.0.0.0');
    expect(r.broadcast).toBe('255.255.255.255');
    expect(r.totalHosts).toBe(Math.pow(2, 32));
  });

  it('identifies IP class A', () => {
    const r = calcSubnet('10.0.0.0/8');
    expect(r.ipClass).toBe('A');
  });

  it('identifies IP class C', () => {
    const r = calcSubnet('192.168.1.0/24');
    expect(r.ipClass).toBe('C');
  });

  it('normalizes non-network address', () => {
    const r = calcSubnet('192.168.1.100/24');
    expect(r.network).toBe('192.168.1.0');
  });

  it('produces binary mask for /24', () => {
    const r = calcSubnet('192.168.1.0/24');
    expect(r.binaryMask).toBe('11111111.11111111.11111111.00000000');
  });
});
