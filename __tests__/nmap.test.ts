import {
  parseNmapScan,
  getAddresses,
  getHostnames,
  generatePortScanInfo,
  getCPE,
  scriptContains,
  findOS,
  getScripts,
  decodeNumericEntities,
} from '../Components/Functions/NmapViewer/utils';
import type { HostAddressType, HostType } from '../Components/Functions/NmapViewer/types';

const SIMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nmaprun scanner="nmap" version="7.94">
  <scaninfo type="syn" protocol="tcp" numservices="1000" services="1-1000"/>
  <host>
    <status state="up" reason="echo-reply" reason_ttl="64"/>
    <address addr="192.168.1.1" addrtype="ipv4"/>
    <hostnames/>
    <ports>
      <port protocol="tcp" portid="80">
        <state state="open" reason="syn-ack" reason_ttl="64"/>
        <service name="http" product="nginx" version="1.18"/>
      </port>
      <port protocol="tcp" portid="443">
        <state state="open" reason="syn-ack" reason_ttl="64"/>
        <service name="https"/>
      </port>
    </ports>
  </host>
</nmaprun>`;

// --- parseNmapScan ---
describe('parseNmapScan', () => {
  it('parses valid Nmap XML without throwing', () => {
    const result = parseNmapScan(SIMPLE_XML);
    expect(result).not.toBeNull();
  });
  it('returns null for completely broken input', () => {
    // fast-xml-parser is lenient, but passing null/undefined should return null
    const result = parseNmapScan(null as unknown as string);
    expect(result).toBeNull();
  });
});

// --- getAddresses ---
describe('getAddresses', () => {
  it('parses an IPv4 address', () => {
    const addresses: HostAddressType[] = [{ '@_addr': '192.168.1.1', '@_addrtype': 'ipv4' }];
    expect(getAddresses(addresses)).toEqual({ ipv4: '192.168.1.1', ipv6: '', mac: '' });
  });
  it('parses a MAC address', () => {
    const addresses: HostAddressType[] = [{ '@_addr': 'AA:BB:CC:DD:EE:FF', '@_addrtype': 'mac' }];
    expect(getAddresses(addresses)).toEqual({ ipv4: '', ipv6: '', mac: 'AA:BB:CC:DD:EE:FF' });
  });
  it('parses IPv4, IPv6 and MAC together', () => {
    const addresses: HostAddressType[] = [
      { '@_addr': '10.0.0.1', '@_addrtype': 'ipv4' },
      { '@_addr': '::1', '@_addrtype': 'ipv6' },
      { '@_addr': '00:11:22:33:44:55', '@_addrtype': 'mac' },
    ];
    expect(getAddresses(addresses)).toEqual({
      ipv4: '10.0.0.1',
      ipv6: '::1',
      mac: '00:11:22:33:44:55',
    });
  });
});

// --- getHostnames ---
describe('getHostnames', () => {
  it('returns empty string for empty hostnames', () => {
    expect(getHostnames([])).toBe('');
  });
  it('returns the hostname string when present', () => {
    const result = getHostnames([{ hostname: { '@_name': 'example.com', '@_type': 'PTR' } }]);
    expect(result).toContain('example.com');
  });
});

// --- generatePortScanInfo ---
describe('generatePortScanInfo', () => {
  it('returns an array with port numbers and states', () => {
    const ports = {
      port: [
        { '@_portid': '80', '@_protocol': 'tcp', state: { '@_state': 'open', '@_reason': '', '@_reason_ttl': '' } },
        { '@_portid': '443', '@_protocol': 'tcp', state: { '@_state': 'open', '@_reason': '', '@_reason_ttl': '' } },
      ],
    };
    expect(generatePortScanInfo(ports)).toEqual([
      { number: '80', state: 'open' },
      { number: '443', state: 'open' },
    ]);
  });
  it('returns empty array when no ports object is provided', () => {
    expect(generatePortScanInfo(null)).toEqual([]);
    expect(generatePortScanInfo({})).toEqual([]);
  });
  it('handles a single port (object instead of array)', () => {
    const ports = {
      port: { '@_portid': '22', '@_protocol': 'tcp', state: { '@_state': 'closed', '@_reason': '', '@_reason_ttl': '' } },
    };
    expect(generatePortScanInfo(ports)).toEqual([{ number: '22', state: 'closed' }]);
  });
});

// --- getCPE ---
describe('getCPE', () => {
  it('returns a single CPE string as-is', () => {
    expect(getCPE('cpe:/a:apache:http_server')).toBe('cpe:/a:apache:http_server');
  });
  it('joins multiple CPEs with ", "', () => {
    expect(getCPE(['cpe:/a:apache', 'cpe:/o:linux'])).toBe('cpe:/a:apache, cpe:/o:linux');
  });
  it('deduplicates repeated CPEs', () => {
    expect(getCPE(['cpe:/a:nginx', 'cpe:/a:nginx'])).toBe('cpe:/a:nginx');
  });
});

// --- scriptContains ---
describe('scriptContains', () => {
  const scripts = [
    { '@_id': 'http-title', '@_output': 'Did not follow redirect to https://example.com/' },
  ];
  it('returns true when output contains the query', () => {
    expect(scriptContains(scripts, 'example')).toBe(true);
  });
  it('requires a lowercase query (output is lowercased, query is not)', () => {
    expect(scriptContains(scripts, 'EXAMPLE')).toBe(false);
  });
  it('returns false when query is not found', () => {
    expect(scriptContains(scripts, 'foobar')).toBe(false);
  });
  it('returns false for an empty scripts value', () => {
    expect(scriptContains('', 'query')).toBe(false);
  });
});

// --- findOS ---
describe('findOS', () => {
  const hostWith = (os: unknown) => ({ os } as unknown as HostType);

  it('reads the OS when nmap emitted a single <osmatch> (parsed as an object)', () => {
    const host = hostWith({ osmatch: { osclass: { '@_vendor': 'Linux', '@_osfamily': 'Linux' } } });
    expect(findOS(host)).toEqual({ vendor: 'Linux', family: 'Linux' });
  });
  it('takes the first match when several <osmatch> elements are present', () => {
    const host = hostWith({
      osmatch: [
        { osclass: { '@_vendor': 'Microsoft', '@_osfamily': 'Windows' } },
        { osclass: { '@_vendor': 'Linux', '@_osfamily': 'Linux' } },
      ],
    });
    expect(findOS(host)).toEqual({ vendor: 'Microsoft', family: 'Windows' });
  });
  it('handles several <osclass> elements inside one match', () => {
    const host = hostWith({
      osmatch: { osclass: [{ '@_vendor': 'Apple', '@_osfamily': 'macOS' }, { '@_vendor': 'Linux', '@_osfamily': 'Linux' }] },
    });
    expect(findOS(host)).toEqual({ vendor: 'Apple', family: 'macOS' });
  });
  it('falls back to "?" when there is no OS information at all', () => {
    expect(findOS({} as HostType)).toEqual({ vendor: '?', family: '?' });
  });
});

// --- decodeNumericEntities ---
describe('decodeNumericEntities', () => {
  it('decodes the decimal and hex newlines nmap writes into script output', () => {
    expect(decodeNumericEntities('a&#10;b&#xa;c')).toBe('a\nb\nc');
  });
  it('leaves text without numeric references untouched', () => {
    expect(decodeNumericEntities('Supported Methods: GET HEAD')).toBe('Supported Methods: GET HEAD');
  });
  it('leaves out-of-range references as written', () => {
    expect(decodeNumericEntities('&#x110000;')).toBe('&#x110000;');
  });
});

// --- getScripts ---
describe('getScripts', () => {
  it('decodes entities in the output of a single script', () => {
    const scripts = getScripts({ '@_id': 'ssh-hostkey', '@_output': 'line1&#xa;line2' } as never);
    expect(scripts).toEqual([{ '@_id': 'ssh-hostkey', '@_output': 'line1\nline2' }]);
  });
  it('decodes entities across an array of scripts', () => {
    const scripts = getScripts([
      { '@_id': 'http-title', '@_output': 'Welcome' },
      { '@_id': 'http-methods', '@_output': 'GET&#10;POST' },
    ]);
    expect(scripts[1]['@_output']).toBe('GET\nPOST');
  });
  it('returns a blank entry when there are no scripts', () => {
    expect(getScripts(undefined as never)).toEqual([{ '@_id': '', '@_output': '' }]);
  });
});
