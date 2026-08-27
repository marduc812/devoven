import { classifyIpv4, searchPorts, PORT_TABLE } from '../Components/Functions/NetworkTools2/logic';

// ─── classifyIpv4 ─────────────────────────────────────────────────────────────

describe('classifyIpv4', () => {
  it('classifies 10.0.0.1 as private A', () => expect(classifyIpv4('10.0.0.1').class).toBe('Private (Class A)'));
  it('classifies 192.168.1.1 as private C', () => expect(classifyIpv4('192.168.1.1').class).toBe('Private (Class C)'));
  it('classifies 8.8.8.8 as public', () => expect(classifyIpv4('8.8.8.8').class).toBe('Public'));
  it('classifies 127.0.0.1 as loopback', () => expect(classifyIpv4('127.0.0.1').class).toBe('Loopback'));
  it('throws on invalid IP', () => expect(() => classifyIpv4('999.0.0.1')).toThrow());
});

describe('classifyIpv4 additional', () => {
  it('classifies 172.16.0.1 as private B', () => expect(classifyIpv4('172.16.0.1').class).toBe('Private (Class B)'));
  it('classifies 172.31.255.255 as private B', () => expect(classifyIpv4('172.31.255.255').class).toBe('Private (Class B)'));
  it('classifies 172.32.0.0 as public (not private B)', () => expect(classifyIpv4('172.32.0.0').class).toBe('Public'));
  it('classifies 169.254.1.1 as link-local', () => expect(classifyIpv4('169.254.1.1').class).toBe('Link-Local'));
  it('classifies 224.0.0.1 as multicast', () => expect(classifyIpv4('224.0.0.1').class).toBe('Multicast'));
  it('classifies 255.255.255.255 as broadcast', () => expect(classifyIpv4('255.255.255.255').class).toBe('Broadcast'));
  it('classifies 240.0.0.1 as reserved', () => expect(classifyIpv4('240.0.0.1').class).toBe('Reserved'));
  it('throws on missing octets', () => expect(() => classifyIpv4('192.168.1')).toThrow());
  it('throws on non-numeric', () => expect(() => classifyIpv4('abc.def.ghi.jkl')).toThrow());
  it('returns correct range for loopback', () => expect(classifyIpv4('127.0.0.1').range).toBe('127.0.0.0/8'));
});

// ─── searchPorts ─────────────────────────────────────────────────────────────

describe('searchPorts', () => {
  it('returns all ports for empty query', () => expect(searchPorts('')).toHaveLength(PORT_TABLE.length));
  it('finds port 80 by number', () => {
    const results = searchPorts('80');
    expect(results.some(e => e.port === 80)).toBe(true);
  });
  it('finds SSH by service name', () => {
    const results = searchPorts('SSH');
    expect(results.some(e => e.service === 'SSH')).toBe(true);
  });
  it('finds entries by description keyword', () => {
    const results = searchPorts('database');
    expect(results.length).toBeGreaterThan(0);
  });
  it('returns empty for unknown query', () => expect(searchPorts('xyzunknown123')).toHaveLength(0));
});
