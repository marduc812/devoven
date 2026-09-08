import {
  packetHexToBytes,
  internetChecksum,
  parseEthernet,
  parseIpv4,
  parseTcp,
  parseUdp,
  parseTlsRecords,
  dissect,
  dissectText,
  SAMPLES,
} from '@/Components/Functions/PacketTools/logic';
import {
  ipToInt,
  intToIp,
  parseEntry,
  mergeRanges,
  rangeToCidrs,
  groupIps,
  groupIpsText,
  IP_SAMPLE,
} from '@/Components/Functions/IpGroupTools/logic';

const bytes = (hex: string) => packetHexToBytes(hex);

/** The field value from a section, by label. */
const value = (fields: { label: string; value: string }[], label: string) =>
  fields.find((f) => f.label === label)?.value;
const note = (fields: { label: string; note?: string }[], label: string) =>
  fields.find((f) => f.label === label)?.note;

describe('hex input', () => {
  it('accepts spaces, colons, comments and hexdump offsets', () => {
    expect([...bytes('45 00')]).toEqual([0x45, 0x00]);
    expect([...bytes('45:00')]).toEqual([0x45, 0x00]);
    expect([...bytes('// a note\n4500')]).toEqual([0x45, 0x00]);
    expect([...bytes('0000  45 00 00 3c')]).toEqual([0x45, 0x00, 0x00, 0x3c]);
  });

  it('rejects what is not hex', () => {
    expect(() => bytes('45 0z')).toThrow('not hex');
    expect(() => bytes('450')).toThrow('even number');
    expect(() => bytes('   ')).toThrow('Paste the packet');
  });
});

describe('internetChecksum', () => {
  it('matches the worked example from RFC 1071', () => {
    // The classic 00 01 f2 03 f4 f5 f6 f7 block sums to 0x220d.
    expect(internetChecksum(bytes('00 01 f2 03 f4 f5 f6 f7'))).toBe(0x220d);
  });

  it('returns zero over a header that already carries its own checksum', () => {
    const header = bytes('45 00 00 3c 1c 46 40 00 40 06 27 8b c0 a8 00 68 5d b8 d8 22');
    expect(internetChecksum(header)).toBe(0);
  });
});

describe('Ethernet', () => {
  it('reads the addresses and the ethertype', () => {
    const { section, ethertype, payloadStart } = parseEthernet(
      bytes('aa bb cc dd ee ff 11 22 33 44 55 66 08 00'),
    );
    expect(value(section.fields, 'Destination')).toBe('aa:bb:cc:dd:ee:ff');
    expect(value(section.fields, 'Source')).toBe('11:22:33:44:55:66');
    expect(note(section.fields, 'EtherType')).toBe('IPv4');
    expect(ethertype).toBe(0x0800);
    expect(payloadStart).toBe(14);
  });

  it('flags a broadcast and a locally administered address', () => {
    const { section } = parseEthernet(bytes('ff ff ff ff ff ff 02 00 00 00 00 01 08 06'));
    expect(note(section.fields, 'Destination')).toBe('broadcast');
    expect(note(section.fields, 'Source')).toContain('locally administered');
    expect(note(section.fields, 'EtherType')).toBe('ARP');
  });

  it('walks past VLAN tags to the real ethertype', () => {
    const { section, ethertype, payloadStart } = parseEthernet(
      bytes('aabbccddeeff 112233445566 8100 0064 0800'),
    );
    expect(value(section.fields, '802.1Q tag')).toBe('VLAN 100');
    expect(ethertype).toBe(0x0800);
    expect(payloadStart).toBe(18);
  });

  it('says when a frame is too short to be a header', () => {
    expect(() => parseEthernet(bytes('aabbcc'))).toThrow('needs 14 bytes');
  });
});

describe('IPv4', () => {
  const HEADER = '45 00 00 3c 1c 46 40 00 40 06 27 8b c0 a8 00 68 5d b8 d8 22';

  it('reads every field of a real header', () => {
    const { section, protocol, payloadStart } = parseIpv4(bytes(HEADER));
    expect(value(section.fields, 'Version')).toBe('4');
    expect(value(section.fields, 'Header length')).toBe('20 bytes');
    expect(value(section.fields, 'Total length')).toBe('60 bytes');
    expect(value(section.fields, 'TTL')).toBe('64');
    expect(note(section.fields, 'Protocol')).toBe('TCP');
    expect(value(section.fields, 'Source')).toBe('192.168.0.104');
    expect(value(section.fields, 'Destination')).toBe('93.184.216.34');
    expect(note(section.fields, 'Flags')).toBe("don't fragment");
    expect(protocol).toBe(6);
    expect(payloadStart).toBe(20);
  });

  it('verifies the header checksum', () => {
    expect(note(parseIpv4(bytes(HEADER)).section.fields, 'Checksum')).toBe('valid');
    const broken = HEADER.replace('27 8b', '27 8c');
    const result = parseIpv4(bytes(broken));
    expect(note(result.section.fields, 'Checksum')).toContain('INVALID');
    expect(result.section.warnings.join(' ')).toContain('does not match');
  });

  it('names the DSCP and ECN codepoints', () => {
    const marked = HEADER.replace('45 00', '45 ba');
    const { section } = parseIpv4(bytes(marked));
    expect(note(section.fields, 'DSCP')).toBe('EF');
    expect(note(section.fields, 'ECN')).toBe('ECT(0)');
  });

  it('shows options when the header is longer than 20 bytes', () => {
    // IHL 6: one extra 32-bit word of options.
    const withOptions = '46 00 00 40 00 00 00 00 40 06 f6 63 c0 a8 00 01 c0 a8 00 02 01 01 01 00';
    const { section, payloadStart } = parseIpv4(bytes(withOptions));
    expect(value(section.fields, 'Options')).toBe('01010100');
    expect(payloadStart).toBe(24);
  });

  it('warns about a fragment and a short paste', () => {
    const fragment = '45 00 05 dc 1c 46 20 01 40 06 41 ea c0 a8 00 68 5d b8 d8 22';
    const { section } = parseIpv4(bytes(fragment));
    expect(note(section.fields, 'Flags')).toBe('more fragments');
    expect(value(section.fields, 'Fragment offset')).toBe('1');
    expect(section.warnings.join(' ')).toContain('fragment');
    expect(section.warnings.join(' ')).toContain('only 20 were pasted');
  });
});

describe('TCP', () => {
  const SYN =
    'c3 50 01 bb 00 00 00 01 00 00 00 00 a0 02 fa f0 f7 6c 00 00 ' +
    '02 04 05 b4 04 02 08 0a 00 0f 42 40 00 00 00 00 01 03 03 07';

  it('reads the ports, sequence and flags', () => {
    const { section, payloadStart } = parseTcp(bytes(SYN));
    expect(value(section.fields, 'Source port')).toBe('50000');
    expect(value(section.fields, 'Destination port')).toBe('443');
    expect(note(section.fields, 'Destination port')).toBe('https');
    expect(value(section.fields, 'Sequence')).toBe('1');
    expect(note(section.fields, 'Flags')).toBe('SYN');
    expect(value(section.fields, 'Window')).toBe('64240');
    expect(value(section.fields, 'Header length')).toBe('40 bytes');
    expect(payloadStart).toBe(40);
  });

  it('reads the options', () => {
    const { section } = parseTcp(bytes(SYN));
    expect(value(section.fields, 'MSS')).toBe('1460');
    expect(value(section.fields, 'SACK permitted')).toBe('yes');
    expect(value(section.fields, 'Timestamps')).toBe('TSval 1000000, TSecr 0');
    expect(value(section.fields, 'Window scale')).toBe('7');
    expect(note(section.fields, 'Window scale')).toBe('multiplier 128');
  });

  it('names every flag that is set', () => {
    const finAck = 'c3 50 01 bb 00 00 00 01 00 00 00 02 50 11 fa f0 00 00 00 00';
    expect(note(parseTcp(bytes(finAck)).section.fields, 'Flags')).toBe('ACK, FIN');
  });

  it('notes when ACK and URG are not set', () => {
    const { section } = parseTcp(bytes(SYN));
    expect(note(section.fields, 'Acknowledgement')).toContain('ACK not set');
    expect(note(section.fields, 'Urgent pointer')).toContain('URG not set');
  });

  it('needs a whole header', () => {
    expect(() => parseTcp(bytes('c3 50 01 bb'))).toThrow('needs 20 bytes');
  });

  it('says when the options were cut off the paste', () => {
    const truncated = 'c3 50 01 bb 00 00 00 01 00 00 00 00 a0 02 fa f0 f7 6c 00 00 02 04 05 b4';
    const { section } = parseTcp(bytes(truncated));
    expect(section.warnings.join(' ')).toContain('only 24 were pasted');
  });
});

describe('UDP', () => {
  it('reads the header and the payload length', () => {
    const { section, payloadStart, payloadLength } = parseUdp(bytes('d4 31 00 35 00 28 00 00'));
    expect(value(section.fields, 'Source port')).toBe('54321');
    expect(note(section.fields, 'Destination port')).toBe('dns');
    expect(value(section.fields, 'Length')).toBe('40 bytes');
    expect(note(section.fields, 'Checksum')).toContain('not computed');
    expect(payloadStart).toBe(8);
    expect(payloadLength).toBe(0);
  });

  it('warns when the length overruns the paste', () => {
    const { section } = parseUdp(bytes('d4 31 00 35 01 00 00 00'));
    expect(section.warnings.join(' ')).toContain('only 8 were pasted');
  });
});

describe('TLS records', () => {
  it('reads an alert', () => {
    const [record] = parseTlsRecords(bytes('15 03 03 00 02 02 28'));
    expect(note(record.fields, 'Content type')).toBe('Alert');
    expect(value(record.fields, 'Record version')).toBe('TLS 1.2');
    expect(note(record.fields, 'Alert level')).toBe('fatal');
    expect(note(record.fields, 'Alert description')).toBe('handshake_failure');
  });

  it('reads a ClientHello down to the SNI and ALPN', () => {
    const clientHello = [
      '16 03 01 00 4e',                            // record: handshake, TLS 1.0, 78 bytes
      '01 00 00 4a',                               // ClientHello, 74 bytes
      '03 03',                                     // client version TLS 1.2
      '00 '.repeat(32),                            // random
      '00',                                        // no session id
      '00 04 13 01 c0 2f',                         // two cipher suites
      '01 00',                                     // one compression method
      '00 1d',                                     // extensions, 29 bytes
      '00 00 00 10 00 0e 00 00 0b 65 78 61 6d 70 6c 65 2e 63 6f 6d', // SNI example.com
      '00 10 00 05 00 03 02 68 32',                // ALPN h2
    ].join(' ');
    const [record] = parseTlsRecords(bytes(clientHello));
    expect(note(record.fields, 'Handshake type')).toBe('ClientHello');
    expect(value(record.fields, '  Client version')).toBe('TLS 1.2');
    expect(note(record.fields, '  Cipher suites')).toContain('TLS_AES_128_GCM_SHA256');
    expect(value(record.fields, '  SNI')).toBe('example.com');
    expect(value(record.fields, '  ALPN')).toBe('h2');
  });

  it('says that application data is not readable', () => {
    const [record] = parseTlsRecords(bytes('17 03 03 00 04 de ad be ef'));
    expect(note(record.fields, 'Payload')).toContain('not readable');
  });

  it('reads several records in a row', () => {
    expect(parseTlsRecords(bytes('15 03 03 00 02 01 00 15 03 03 00 02 02 28'))).toHaveLength(2);
  });

  it('warns when the bytes are not a TLS record', () => {
    const [record] = parseTlsRecords(bytes('45 00 00 3c 00'));
    expect(record.warnings.join(' ')).toContain('not a TLS record type');
  });

  it('needs five bytes', () => {
    expect(() => parseTlsRecords(bytes('15 03'))).toThrow('at least 5 bytes');
  });
});

describe('dissect', () => {
  it('walks Ethernet into IPv4 into TCP', () => {
    const result = dissect(SAMPLES.ethernet, 'ethernet');
    expect(result.sections.map((s) => s.title)).toEqual(['Ethernet II', 'IPv4', 'TCP']);
    expect(result.remainingHex).toBe('');
  });

  it('walks IPv4 into UDP', () => {
    expect(dissect(SAMPLES.ipv4, 'ipv4').sections.map((s) => s.title)).toEqual(['IPv4', 'UDP']);
  });

  it('stops at a protocol it does not know and says so', () => {
    const icmp = '45 00 00 1c 00 00 00 00 40 01 f9 8d c0 a8 00 01 c0 a8 00 02 08 00 f7 ff 00 00 00 00';
    const result = dissect(icmp, 'ipv4');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].warnings.join(' ')).toContain('ICMP');
    expect(result.remainingHex).toHaveLength(16);
  });

  it('stops where a header was not pasted rather than failing', () => {
    const headerOnly = '45 00 00 3c 1c 46 40 00 40 06 27 8b c0 a8 00 68 5d b8 d8 22';
    const result = dissect(headerOnly, 'ipv4');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].warnings.join(' ')).toContain('TCP header it points to was not included');

    const frameOnly = dissect('aa bb cc dd ee ff 11 22 33 44 55 66 08 00', 'ethernet');
    expect(frameOnly.sections).toHaveLength(1);
    expect(frameOnly.sections[0].warnings.join(' ')).toContain('IPv4 header it points to was not included');
  });

  it('follows TCP into a TLS record when the payload looks like one', () => {
    const tcpThenTls =
      'c3 50 01 bb 00 00 00 01 00 00 00 02 50 18 fa f0 00 00 00 00 15 03 03 00 02 01 00';
    expect(dissect(tcpThenTls, 'tcp').sections.map((s) => s.title))
      .toEqual(['TCP', 'TLS record 1']);
  });

  it('formats a readable report from every sample', () => {
    for (const layer of ['ethernet', 'ipv4', 'tcp', 'udp', 'tls'] as const) {
      const text = dissectText(SAMPLES[layer], layer);
      expect(text.length).toBeGreaterThan(50);
      expect(text).toContain('──');
    }
  });
});

describe('group IP addresses', () => {
  it('converts to and from integers', () => {
    expect(ipToInt('0.0.0.0')).toBe(0);
    expect(ipToInt('255.255.255.255')).toBe(4294967295);
    expect(intToIp(ipToInt('192.168.1.1'))).toBe('192.168.1.1');
    expect(() => ipToInt('1.2.3')).toThrow('not an IPv4 address');
    expect(() => ipToInt('1.2.3.256')).toThrow('above 255');
  });

  it('reads every entry shape', () => {
    expect(parseEntry('10.0.0.1')).toEqual({ start: ipToInt('10.0.0.1'), end: ipToInt('10.0.0.1') });
    expect(parseEntry('10.0.0.0/30')).toEqual({ start: ipToInt('10.0.0.0'), end: ipToInt('10.0.0.3') });
    expect(parseEntry('10.0.0.5/30')).toEqual({ start: ipToInt('10.0.0.4'), end: ipToInt('10.0.0.7') });
    expect(parseEntry('10.0.0.1-10.0.0.9')).toEqual({ start: ipToInt('10.0.0.1'), end: ipToInt('10.0.0.9') });
    expect(parseEntry('192.168.1.0 255.255.255.0'))
      .toEqual({ start: ipToInt('192.168.1.0'), end: ipToInt('192.168.1.255') });
    expect(parseEntry('0.0.0.0/0')).toEqual({ start: 0, end: 4294967295 });
  });

  it('refuses a bad entry', () => {
    expect(() => parseEntry('10.0.0.0/33')).toThrow('above /32');
    expect(() => parseEntry('10.0.0.9-10.0.0.1')).toThrow('ends before it starts');
    expect(() => parseEntry('10.0.0.0 255.0.255.0')).toThrow('not a contiguous netmask');
  });

  it('merges ranges that touch or overlap', () => {
    const merged = mergeRanges([
      { start: 5, end: 9 },
      { start: 1, end: 4 },
      { start: 20, end: 25 },
      { start: 22, end: 30 },
    ]);
    expect(merged).toEqual([{ start: 1, end: 9 }, { start: 20, end: 30 }]);
  });

  it('splits a range into aligned CIDR blocks', () => {
    expect(rangeToCidrs({ start: ipToInt('10.0.0.0'), end: ipToInt('10.0.0.3') }))
      .toEqual(['10.0.0.0/30']);
    expect(rangeToCidrs({ start: ipToInt('10.0.0.1'), end: ipToInt('10.0.0.6') }))
      .toEqual(['10.0.0.1/32', '10.0.0.2/31', '10.0.0.4/31', '10.0.0.6/32']);
    expect(rangeToCidrs({ start: 0, end: 4294967295 })).toEqual(['0.0.0.0/0']);
  });

  it('collapses a list into the blocks that cover exactly it', () => {
    const result = groupIps('192.168.1.0\n192.168.1.1\n192.168.1.2\n192.168.1.3');
    expect(result.lines).toEqual(['192.168.1.0/30']);
    expect(result.addressCount).toBe(4);
    expect(result.blockCount).toBe(1);
  });

  it('never widens a block past what the input covered', () => {
    expect(groupIps('10.0.0.1\n10.0.0.2').lines).toEqual(['10.0.0.1/32', '10.0.0.2/32']);
  });

  it('widens to a floor prefix only when asked', () => {
    expect(groupIps('10.0.0.1\n10.0.0.99', { minPrefix: 24 }).lines).toEqual(['10.0.0.0/24']);
    expect(groupIps('10.0.0.1\n10.0.1.1', { minPrefix: 24 }).lines)
      .toEqual(['10.0.0.0/24', '10.0.1.0/24']);
  });

  it('can report merged ranges instead of blocks', () => {
    expect(groupIps('10.0.0.1\n10.0.0.2\n10.0.0.3', { asRanges: true }).lines)
      .toEqual(['10.0.0.1-10.0.0.3']);
  });

  it('shows the size of each block when asked', () => {
    expect(groupIps('192.168.1.0/24', { detailed: true }).lines[0])
      .toContain('192.168.1.0 - 192.168.1.255  (256 addresses)');
  });

  it('collects the lines it could not read rather than failing', () => {
    const result = groupIps('10.0.0.1\nnot-an-ip\n10.0.0.2');
    expect(result.lines).toEqual(['10.0.0.1/32', '10.0.0.2/32']);
    expect(result.errors).toHaveLength(1);
    expect(result.inputCount).toBe(2);
  });

  it('skips comments and takes commas as separators', () => {
    expect(groupIps('10.0.0.0/31 # first pair\n10.0.0.2, 10.0.0.3').lines)
      .toEqual(['10.0.0.0/30']);
  });

  it('fails when nothing at all parsed', () => {
    expect(() => groupIps('nonsense')).toThrow('not an IPv4 address');
    expect(() => groupIps('   ')).toThrow('Paste a list');
  });

  it('handles its own sample', () => {
    const lines = groupIpsText(IP_SAMPLE).split('\n');
    expect(lines).toContain('192.168.1.1/32');
    expect(lines).toContain('10.0.0.0/30');
    expect(lines).toContain('10.0.0.4/31');
    expect(lines).toContain('172.16.5.0/24');
  });
});
