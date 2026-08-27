import {
  calculatePacketSize,
  formatBytes,
  PROTOCOL_STACKS,
  STANDARD_MTUS,
} from '../Components/Functions/PacketSizeTools/logic';

describe('calculatePacketSize', () => {
  it('calculates UDP/IPv4/Ethernet correctly', () => {
    // ethernet 14 + ipv4 20 + udp 8 = 42 bytes overhead
    const result = calculatePacketSize(100, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500);
    expect(result.payloadSize).toBe(100);
    expect(result.overhead).toBe(42);
    expect(result.totalSize).toBe(142);
    expect(result.packetsNeeded).toBe(1);
  });

  it('calculates TCP/IPv4/Ethernet correctly', () => {
    // ethernet 14 + ipv4 20 + tcp 20 = 54 bytes overhead
    const result = calculatePacketSize(100, PROTOCOL_STACKS['TCP/IPv4/Ethernet'], 1500);
    expect(result.overhead).toBe(54);
    expect(result.totalSize).toBe(154);
  });

  it('detects fragmentation when packet exceeds MTU', () => {
    const result = calculatePacketSize(2000, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500);
    expect(result.packetsNeeded).toBeGreaterThan(1);
    expect(result.fragments.length).toBeGreaterThan(0);
  });

  it('no fragmentation when packet fits MTU', () => {
    const result = calculatePacketSize(100, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500);
    expect(result.packetsNeeded).toBe(1);
    expect(result.fragments).toHaveLength(0);
  });

  it('calculates efficiency as percentage', () => {
    const result = calculatePacketSize(100, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500);
    expect(result.efficiency).toBeGreaterThan(0);
    expect(result.efficiency).toBeLessThan(100);
  });

  it('throws on negative payload', () => {
    expect(() => calculatePacketSize(-1, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500)).toThrow();
  });

  it('throws on invalid MTU', () => {
    expect(() => calculatePacketSize(100, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 0)).toThrow();
  });

  it('handles zero payload', () => {
    const result = calculatePacketSize(0, PROTOCOL_STACKS['UDP/IPv4/Ethernet'], 1500);
    expect(result.payloadSize).toBe(0);
    expect(result.packetsNeeded).toBe(1);
  });
});

describe('formatBytes', () => {
  it('formats bytes under 1024', () => expect(formatBytes(100)).toBe('100 B'));
  it('formats kilobytes', () => expect(formatBytes(2048)).toBe('2.00 KB'));
  it('formats megabytes', () => expect(formatBytes(1048576)).toBe('1.00 MB'));
});

describe('PROTOCOL_STACKS', () => {
  it('has expected stacks', () => {
    expect(PROTOCOL_STACKS['TCP/IPv4/Ethernet']).toBeDefined();
    expect(PROTOCOL_STACKS['UDP/IPv6/Ethernet']).toBeDefined();
  });
});

describe('STANDARD_MTUS', () => {
  it('has Ethernet MTU of 1500', () => {
    expect(STANDARD_MTUS['Ethernet (standard)']).toBe(1500);
  });
});
