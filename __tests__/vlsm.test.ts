import { calculateVlsm } from '@/Components/Functions/VlsmTools/logic';

describe('calculateVlsm', () => {
  it('allocates subnets largest-first', () => {
    const result = calculateVlsm('192.168.1.0/24', '50\n10\n30');
    expect(result.error).toBeUndefined();
    // Largest (50) should be first subnet
    expect(result.subnets[0].requiredHosts).toBe(50);
    expect(result.subnets[1].requiredHosts).toBe(30);
    expect(result.subnets[2].requiredHosts).toBe(10);
  });

  it('calculates correct prefix for 50 hosts', () => {
    const result = calculateVlsm('192.168.1.0/24', '50');
    expect(result.error).toBeUndefined();
    // 50 hosts needs /26 (62 usable)
    expect(result.subnets[0].prefixLength).toBe(26);
    expect(result.subnets[0].allocatedHosts).toBe(62);
  });

  it('calculates correct prefix for 2 hosts', () => {
    const result = calculateVlsm('192.168.1.0/30', '2');
    expect(result.error).toBeUndefined();
    expect(result.subnets[0].prefixLength).toBe(30);
  });

  it('returns error for invalid CIDR', () => {
    const result = calculateVlsm('badcidr', '10');
    expect(result.error).toBeTruthy();
  });

  it('returns error for insufficient address space', () => {
    const result = calculateVlsm('192.168.1.0/30', '1000');
    expect(result.error).toBeTruthy();
  });

  it('calculates usedAddresses and remainingAddresses', () => {
    const result = calculateVlsm('10.0.0.0/24', '100\n50');
    expect(result.error).toBeUndefined();
    expect(result.usedAddresses).toBeGreaterThan(0);
    expect(result.remainingAddresses).toBeGreaterThan(0);
    expect(result.usedAddresses + result.remainingAddresses).toBe(result.totalAddresses);
  });

  it('supports labels', () => {
    const result = calculateVlsm('10.0.0.0/24', 'Office: 50\nLab: 10');
    expect(result.error).toBeUndefined();
    expect(result.subnets[0].label).toBe('Office');
    expect(result.subnets[1].label).toBe('Lab');
  });

  it('network address is correctly normalized', () => {
    const result = calculateVlsm('192.168.1.5/24', '10');
    // Should normalize to 192.168.1.0/24
    expect(result.baseNetwork).toBe('192.168.1.0/24');
  });

  it('returns error for empty host requirements', () => {
    const result = calculateVlsm('10.0.0.0/24', '');
    expect(result.error).toBeTruthy();
  });
});
