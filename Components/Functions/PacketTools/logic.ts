// ─── Packet header parsers ───────────────────────────────────────────────────
// Hex bytes in, a labelled dissection out. Each layer knows what it wraps, so a
// parse that starts at the Ethernet frame walks down through IPv4 and TCP into
// the TLS record on top of it.

import { CIPHER_SUITES } from '@/Components/Functions/TlsCipherTools/logic';

export type Layer = 'ethernet' | 'ipv4' | 'tcp' | 'udp' | 'tls';

export type Field = { label: string; value: string; note?: string };

export type Section = {
  title: string;
  fields: Field[];
  warnings: string[];
};

export type Dissection = {
  sections: Section[];
  totalBytes: number;
  /** Bytes left over that no parser claimed. */
  remainingHex: string;
};

// ─── Bytes ────────────────────────────────────────────────────────────────────

export function packetHexToBytes(input: string): Uint8Array {
  const clean = input
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    // Strip a leading hexdump offset column ("0000  45 00 ...") and the ASCII
    // gutter tcpdump and Wireshark put on the right.
    .map((line) => line.replace(/^\s*[0-9a-fA-F]{4,8}[:\s]\s/, ' '))
    .join(' ')
    .replace(/0x/gi, '')
    .replace(/[\s:.,|-]/g, '');
  if (!clean) throw new Error('Paste the packet as hex bytes');
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('That is not hex');
  if (clean.length % 2 !== 0) throw new Error('Hex needs an even number of digits');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const hex = (bytes: Uint8Array, start = 0, length = bytes.length - start): string =>
  [...bytes.subarray(start, start + length)].map((b) => b.toString(16).padStart(2, '0')).join('');

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function need(bytes: Uint8Array, offset: number, count: number, what: string): void {
  if (offset + count > bytes.length) {
    throw new Error(`The ${what} needs ${count} bytes at offset ${offset}, but only ${Math.max(bytes.length - offset, 0)} remain`);
  }
}

// ─── Ethernet ─────────────────────────────────────────────────────────────────

const ETHERTYPES: Record<number, string> = {
  0x0800: 'IPv4',
  0x0806: 'ARP',
  0x8035: 'RARP',
  0x86dd: 'IPv6',
  0x8100: '802.1Q VLAN',
  0x88a8: '802.1ad QinQ',
  0x8847: 'MPLS unicast',
  0x8848: 'MPLS multicast',
  0x88cc: 'LLDP',
};

function macAddress(bytes: Uint8Array, offset: number): string {
  return [...bytes.subarray(offset, offset + 6)].map((b) => b.toString(16).padStart(2, '0')).join(':');
}

function macNote(bytes: Uint8Array, offset: number): string | undefined {
  const first = bytes[offset];
  const notes: string[] = [];
  if (first & 0x01) notes.push('multicast');
  if (first & 0x02) notes.push('locally administered');
  if (hex(bytes, offset, 6) === 'ffffffffffff') return 'broadcast';
  return notes.length ? notes.join(', ') : undefined;
}

export function parseEthernet(bytes: Uint8Array): { section: Section; ethertype: number; payloadStart: number } {
  need(bytes, 0, 14, 'Ethernet header');
  const fields: Field[] = [
    { label: 'Destination', value: macAddress(bytes, 0), note: macNote(bytes, 0) },
    { label: 'Source', value: macAddress(bytes, 6), note: macNote(bytes, 6) },
  ];

  let offset = 12;
  let ethertype = u16(bytes, offset);
  offset += 2;

  // VLAN tags sit between the source address and the real ethertype, and stack.
  while (ethertype === 0x8100 || ethertype === 0x88a8) {
    need(bytes, offset, 4, 'VLAN tag');
    const tag = u16(bytes, offset);
    fields.push({
      label: ethertype === 0x8100 ? '802.1Q tag' : '802.1ad tag',
      value: `VLAN ${tag & 0x0fff}`,
      note: `priority ${tag >> 13}${tag & 0x1000 ? ', drop eligible' : ''}`,
    });
    ethertype = u16(bytes, offset + 2);
    offset += 4;
  }

  const warnings: string[] = [];
  if (ethertype <= 1500) {
    fields.push({ label: 'Length', value: String(ethertype), note: '802.3 frame, not Ethernet II' });
  } else {
    fields.push({
      label: 'EtherType',
      value: `0x${ethertype.toString(16).padStart(4, '0')}`,
      note: ETHERTYPES[ethertype] ?? 'unknown',
    });
  }
  if (bytes.length < 60) warnings.push(`Only ${bytes.length} bytes: a frame on the wire is padded to 60 before the FCS.`);

  return { section: { title: 'Ethernet II', fields, warnings }, ethertype, payloadStart: offset };
}

// ─── IPv4 ─────────────────────────────────────────────────────────────────────

const IP_PROTOCOLS: Record<number, string> = {
  1: 'ICMP', 2: 'IGMP', 6: 'TCP', 17: 'UDP', 41: 'IPv6', 47: 'GRE',
  50: 'ESP', 51: 'AH', 58: 'ICMPv6', 89: 'OSPF', 112: 'VRRP', 132: 'SCTP',
};

const DSCP_NAMES: Record<number, string> = {
  0: 'CS0 (best effort)', 8: 'CS1', 10: 'AF11', 12: 'AF12', 14: 'AF13',
  16: 'CS2', 18: 'AF21', 20: 'AF22', 22: 'AF23', 24: 'CS3',
  26: 'AF31', 28: 'AF32', 30: 'AF33', 32: 'CS4', 34: 'AF41',
  36: 'AF42', 38: 'AF43', 40: 'CS5', 46: 'EF', 48: 'CS6', 56: 'CS7',
};

const ECN_NAMES = ['Not-ECT', 'ECT(1)', 'ECT(0)', 'CE (congestion experienced)'];

const ipv4Address = (bytes: Uint8Array, offset: number): string =>
  [...bytes.subarray(offset, offset + 4)].join('.');

/** The ones-complement sum RFC 1071 defines, over a header with its own sum in it. */
export function internetChecksum(bytes: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i + 1 < bytes.length; i += 2) sum += (bytes[i] << 8) | bytes[i + 1];
  if (bytes.length % 2) sum += bytes[bytes.length - 1] << 8;
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16);
  return (~sum) & 0xffff;
}

export function parseIpv4(bytes: Uint8Array, offset = 0): {
  section: Section;
  protocol: number;
  payloadStart: number;
  payloadLength: number;
} {
  need(bytes, offset, 20, 'IPv4 header');
  const version = bytes[offset] >> 4;
  const ihl = bytes[offset] & 0x0f;
  const headerLength = ihl * 4;
  const warnings: string[] = [];

  if (version !== 4) warnings.push(`Version is ${version}, not 4.`);
  if (ihl < 5) warnings.push(`IHL of ${ihl} is below the minimum of 5.`);
  need(bytes, offset, headerLength, 'IPv4 header with its options');

  const dscp = bytes[offset + 1] >> 2;
  const ecn = bytes[offset + 1] & 0x03;
  const totalLength = u16(bytes, offset + 2);
  const identification = u16(bytes, offset + 4);
  const flagsAndOffset = u16(bytes, offset + 6);
  const flags = flagsAndOffset >> 13;
  const fragmentOffset = flagsAndOffset & 0x1fff;
  const ttl = bytes[offset + 8];
  const protocol = bytes[offset + 9];
  const checksum = u16(bytes, offset + 10);

  const flagNames: string[] = [];
  if (flags & 0x4) flagNames.push('reserved');
  if (flags & 0x2) flagNames.push("don't fragment");
  if (flags & 0x1) flagNames.push('more fragments');

  const forChecksum = bytes.slice(offset, offset + headerLength);
  forChecksum[10] = 0;
  forChecksum[11] = 0;
  const computed = internetChecksum(forChecksum);

  const fields: Field[] = [
    { label: 'Version', value: String(version) },
    { label: 'Header length', value: `${headerLength} bytes`, note: `IHL ${ihl}` },
    { label: 'DSCP', value: String(dscp), note: DSCP_NAMES[dscp] ?? 'unassigned' },
    { label: 'ECN', value: String(ecn), note: ECN_NAMES[ecn] },
    { label: 'Total length', value: `${totalLength} bytes` },
    { label: 'Identification', value: `${identification} (0x${identification.toString(16).padStart(4, '0')})` },
    { label: 'Flags', value: `0x${flags.toString(16)}`, note: flagNames.join(', ') || 'none' },
    { label: 'Fragment offset', value: String(fragmentOffset), note: fragmentOffset ? `${fragmentOffset * 8} bytes in` : undefined },
    { label: 'TTL', value: String(ttl) },
    { label: 'Protocol', value: String(protocol), note: IP_PROTOCOLS[protocol] ?? 'unknown' },
    {
      label: 'Checksum',
      value: `0x${checksum.toString(16).padStart(4, '0')}`,
      note: computed === checksum ? 'valid' : `INVALID, should be 0x${computed.toString(16).padStart(4, '0')}`,
    },
    { label: 'Source', value: ipv4Address(bytes, offset + 12) },
    { label: 'Destination', value: ipv4Address(bytes, offset + 16) },
  ];

  if (headerLength > 20) {
    fields.push({ label: 'Options', value: hex(bytes, offset + 20, headerLength - 20), note: `${headerLength - 20} bytes` });
  }
  if (computed !== checksum) warnings.push('The header checksum does not match. Offload can leave it blank on a captured outbound packet.');
  if (totalLength > bytes.length - offset) {
    warnings.push(`Total length says ${totalLength} bytes but only ${bytes.length - offset} were pasted.`);
  }
  if (fragmentOffset > 0) warnings.push('This is a fragment, so what follows is not a fresh transport header.');

  const available = Math.min(totalLength || bytes.length - offset, bytes.length - offset);
  return {
    section: { title: 'IPv4', fields, warnings },
    protocol,
    payloadStart: offset + headerLength,
    payloadLength: Math.max(available - headerLength, 0),
  };
}

// ─── TCP ──────────────────────────────────────────────────────────────────────

const TCP_FLAGS: [number, string][] = [
  [0x100, 'NS'], [0x80, 'CWR'], [0x40, 'ECE'], [0x20, 'URG'],
  [0x10, 'ACK'], [0x08, 'PSH'], [0x04, 'RST'], [0x02, 'SYN'], [0x01, 'FIN'],
];

function tcpOptions(bytes: Uint8Array, start: number, end: number): Field[] {
  const fields: Field[] = [];
  let offset = start;
  while (offset < end) {
    const kind = bytes[offset];
    if (kind === 0) { fields.push({ label: 'Option', value: 'End of option list' }); break; }
    if (kind === 1) { offset++; continue; } // NOP padding, not worth a row
    const length = bytes[offset + 1];
    if (!length || offset + length > end) {
      fields.push({ label: 'Option', value: `kind ${kind}`, note: 'truncated' });
      break;
    }
    const body = bytes.subarray(offset + 2, offset + length);
    switch (kind) {
      case 2: fields.push({ label: 'MSS', value: String(u16(bytes, offset + 2)) }); break;
      case 3: fields.push({ label: 'Window scale', value: String(body[0]), note: `multiplier ${2 ** body[0]}` }); break;
      case 4: fields.push({ label: 'SACK permitted', value: 'yes' }); break;
      case 5: fields.push({ label: 'SACK blocks', value: hex(body) }); break;
      case 8: fields.push({
        label: 'Timestamps',
        value: `TSval ${u32(bytes, offset + 2)}, TSecr ${u32(bytes, offset + 6)}`,
      }); break;
      default: fields.push({ label: `Option ${kind}`, value: hex(body) || '(empty)' });
    }
    offset += length;
  }
  return fields;
}

export function parseTcp(bytes: Uint8Array, offset = 0): {
  section: Section;
  payloadStart: number;
  payloadLength: number;
} {
  need(bytes, offset, 20, 'TCP header');
  const sourcePort = u16(bytes, offset);
  const destinationPort = u16(bytes, offset + 2);
  const sequence = u32(bytes, offset + 4);
  const acknowledgement = u32(bytes, offset + 8);
  const dataOffset = bytes[offset + 12] >> 4;
  const headerLength = dataOffset * 4;
  const flags = ((bytes[offset + 12] & 0x01) << 8) | bytes[offset + 13];
  const window = u16(bytes, offset + 14);
  const checksum = u16(bytes, offset + 16);
  const urgent = u16(bytes, offset + 18);

  const warnings: string[] = [];
  if (dataOffset < 5) warnings.push(`Data offset of ${dataOffset} is below the minimum of 5.`);
  if (offset + headerLength > bytes.length) {
    warnings.push(
      `The header is ${headerLength} bytes but only ${bytes.length - offset} were pasted, ` +
      'so the options are not shown.',
    );
  }

  const set = TCP_FLAGS.filter(([bit]) => flags & bit).map(([, name]) => name);
  const fields: Field[] = [
    { label: 'Source port', value: String(sourcePort), note: portNote(sourcePort) },
    { label: 'Destination port', value: String(destinationPort), note: portNote(destinationPort) },
    { label: 'Sequence', value: String(sequence) },
    { label: 'Acknowledgement', value: String(acknowledgement), note: flags & 0x10 ? undefined : 'ACK not set, so this is ignored' },
    { label: 'Header length', value: `${headerLength} bytes`, note: `data offset ${dataOffset}` },
    { label: 'Flags', value: `0x${flags.toString(16).padStart(3, '0')}`, note: set.join(', ') || 'none' },
    { label: 'Window', value: String(window) },
    { label: 'Checksum', value: `0x${checksum.toString(16).padStart(4, '0')}`, note: 'needs the IP pseudo-header to verify' },
    { label: 'Urgent pointer', value: String(urgent), note: flags & 0x20 ? undefined : 'URG not set, so this is ignored' },
  ];

  if (headerLength > 20 && offset + headerLength <= bytes.length) {
    fields.push(...tcpOptions(bytes, offset + 20, offset + headerLength));
  }

  return {
    section: { title: 'TCP', fields, warnings },
    payloadStart: offset + headerLength,
    payloadLength: Math.max(bytes.length - offset - headerLength, 0),
  };
}

export function parseUdp(bytes: Uint8Array, offset = 0): {
  section: Section;
  payloadStart: number;
  payloadLength: number;
} {
  need(bytes, offset, 8, 'UDP header');
  const sourcePort = u16(bytes, offset);
  const destinationPort = u16(bytes, offset + 2);
  const length = u16(bytes, offset + 4);
  const checksum = u16(bytes, offset + 6);

  const warnings: string[] = [];
  if (length < 8) warnings.push(`Length of ${length} is below the 8-byte header.`);
  if (length > bytes.length - offset) {
    warnings.push(`Length says ${length} bytes but only ${bytes.length - offset} were pasted.`);
  }

  const fields: Field[] = [
    { label: 'Source port', value: String(sourcePort), note: portNote(sourcePort) },
    { label: 'Destination port', value: String(destinationPort), note: portNote(destinationPort) },
    { label: 'Length', value: `${length} bytes`, note: `${Math.max(length - 8, 0)} bytes of payload` },
    {
      label: 'Checksum',
      value: `0x${checksum.toString(16).padStart(4, '0')}`,
      note: checksum === 0 ? 'zero: not computed, which IPv4 allows' : 'needs the IP pseudo-header to verify',
    },
  ];

  return {
    section: { title: 'UDP', fields, warnings },
    payloadStart: offset + 8,
    payloadLength: Math.max(Math.min(length - 8, bytes.length - offset - 8), 0),
  };
}

const WELL_KNOWN_PORTS: Record<number, string> = {
  20: 'ftp-data', 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns',
  67: 'dhcp server', 68: 'dhcp client', 69: 'tftp', 80: 'http', 110: 'pop3',
  123: 'ntp', 143: 'imap', 161: 'snmp', 389: 'ldap', 443: 'https', 445: 'smb',
  465: 'smtps', 514: 'syslog', 587: 'submission', 636: 'ldaps', 853: 'dns-over-tls',
  993: 'imaps', 995: 'pop3s', 1433: 'mssql', 1521: 'oracle', 3306: 'mysql',
  3389: 'rdp', 5432: 'postgres', 5672: 'amqp', 6379: 'redis', 8080: 'http-alt',
  8443: 'https-alt', 9200: 'elasticsearch', 27017: 'mongodb',
};

function portNote(port: number): string | undefined {
  return WELL_KNOWN_PORTS[port];
}

// ─── TLS records ──────────────────────────────────────────────────────────────

const TLS_CONTENT_TYPES: Record<number, string> = {
  20: 'ChangeCipherSpec', 21: 'Alert', 22: 'Handshake',
  23: 'Application Data', 24: 'Heartbeat',
};

const TLS_VERSIONS: Record<number, string> = {
  0x0300: 'SSL 3.0', 0x0301: 'TLS 1.0', 0x0302: 'TLS 1.1',
  0x0303: 'TLS 1.2', 0x0304: 'TLS 1.3',
};

const HANDSHAKE_TYPES: Record<number, string> = {
  0: 'HelloRequest', 1: 'ClientHello', 2: 'ServerHello', 4: 'NewSessionTicket',
  8: 'EncryptedExtensions', 11: 'Certificate', 12: 'ServerKeyExchange',
  13: 'CertificateRequest', 14: 'ServerHelloDone', 15: 'CertificateVerify',
  16: 'ClientKeyExchange', 20: 'Finished',
};

const TLS_EXTENSIONS: Record<number, string> = {
  0: 'server_name', 5: 'status_request', 10: 'supported_groups',
  11: 'ec_point_formats', 13: 'signature_algorithms', 16: 'application_layer_protocol_negotiation',
  18: 'signed_certificate_timestamp', 21: 'padding', 22: 'encrypt_then_mac',
  23: 'extended_master_secret', 35: 'session_ticket', 41: 'pre_shared_key',
  42: 'early_data', 43: 'supported_versions', 44: 'cookie',
  45: 'psk_key_exchange_modes', 49: 'post_handshake_auth', 50: 'signature_algorithms_cert',
  51: 'key_share', 65281: 'renegotiation_info',
};

const CIPHER_NAMES: Record<string, string> = Object.fromEntries(
  CIPHER_SUITES.map((suite) => [suite.hexCode.toLowerCase(), suite.name]),
);

const ALERT_LEVELS: Record<number, string> = { 1: 'warning', 2: 'fatal' };

const ALERT_DESCRIPTIONS: Record<number, string> = {
  0: 'close_notify', 10: 'unexpected_message', 20: 'bad_record_mac',
  40: 'handshake_failure', 42: 'bad_certificate', 44: 'certificate_revoked',
  45: 'certificate_expired', 46: 'certificate_unknown', 47: 'illegal_parameter',
  48: 'unknown_ca', 49: 'access_denied', 50: 'decode_error', 51: 'decrypt_error',
  70: 'protocol_version', 71: 'insufficient_security', 80: 'internal_error',
  86: 'inappropriate_fallback', 90: 'user_canceled', 109: 'missing_extension',
  112: 'unrecognized_name', 116: 'certificate_required', 120: 'no_application_protocol',
};

function versionName(version: number): string {
  return TLS_VERSIONS[version] ?? `unknown (0x${version.toString(16).padStart(4, '0')})`;
}

function parseClientHelloBody(bytes: Uint8Array, start: number, end: number, fields: Field[]): void {
  let offset = start;
  if (offset + 34 > end) return;
  fields.push({ label: '  Client version', value: versionName(u16(bytes, offset)) });
  fields.push({ label: '  Random', value: hex(bytes, offset + 2, 32) });
  offset += 34;

  const sessionIdLength = bytes[offset];
  if (sessionIdLength) fields.push({ label: '  Session ID', value: hex(bytes, offset + 1, sessionIdLength) });
  offset += 1 + sessionIdLength;

  if (offset + 2 > end) return;
  const suitesLength = u16(bytes, offset);
  offset += 2;
  const suites: string[] = [];
  for (let i = 0; i + 1 < suitesLength && offset + i + 1 < end; i += 2) {
    const code = `0x${hex(bytes, offset + i, 2)}`;
    suites.push(CIPHER_NAMES[code.toLowerCase()] ?? code);
  }
  fields.push({ label: '  Cipher suites', value: String(suites.length), note: suites.slice(0, 12).join(', ') });
  offset += suitesLength;

  if (offset >= end) return;
  const compressionLength = bytes[offset];
  offset += 1 + compressionLength;

  if (offset + 2 > end) return;
  const extensionsLength = u16(bytes, offset);
  offset += 2;
  parseExtensions(bytes, offset, Math.min(offset + extensionsLength, end), fields);
}

function parseExtensions(bytes: Uint8Array, start: number, end: number, fields: Field[]): void {
  let offset = start;
  const seen: string[] = [];
  while (offset + 4 <= end) {
    const type = u16(bytes, offset);
    const length = u16(bytes, offset + 2);
    const body = offset + 4;
    if (body + length > end) break;
    const name = TLS_EXTENSIONS[type] ?? `extension ${type}`;
    seen.push(name);

    if (type === 0 && length > 5) {
      // ServerNameList: 2-byte list length, 1-byte type, 2-byte name length.
      const nameLength = u16(bytes, body + 3);
      const host = new TextDecoder().decode(bytes.subarray(body + 5, body + 5 + nameLength));
      fields.push({ label: '  SNI', value: host });
    } else if (type === 16 && length > 2) {
      const protocols: string[] = [];
      let at = body + 2;
      while (at < body + length) {
        const size = bytes[at];
        protocols.push(new TextDecoder().decode(bytes.subarray(at + 1, at + 1 + size)));
        at += 1 + size;
      }
      fields.push({ label: '  ALPN', value: protocols.join(', ') });
    } else if (type === 43 && length > 1) {
      const versions: string[] = [];
      for (let at = body + 1; at + 1 < body + length; at += 2) versions.push(versionName(u16(bytes, at)));
      fields.push({ label: '  Supported versions', value: versions.join(', ') });
    }

    offset = body + length;
  }
  if (seen.length) fields.push({ label: '  Extensions', value: String(seen.length), note: seen.join(', ') });
}

export function parseTlsRecords(bytes: Uint8Array, offset = 0): Section[] {
  const sections: Section[] = [];
  let at = offset;
  let index = 0;

  while (at + 5 <= bytes.length) {
    const contentType = bytes[at];
    const version = u16(bytes, at + 1);
    const length = u16(bytes, at + 3);
    const body = at + 5;
    const warnings: string[] = [];

    if (!TLS_CONTENT_TYPES[contentType]) {
      warnings.push(`Content type ${contentType} is not a TLS record type. This may be encrypted data or the wrong offset.`);
    }
    if (body + length > bytes.length) {
      warnings.push(`The record declares ${length} bytes but only ${bytes.length - body} remain.`);
    }

    const fields: Field[] = [
      { label: 'Content type', value: String(contentType), note: TLS_CONTENT_TYPES[contentType] ?? 'unknown' },
      { label: 'Record version', value: versionName(version), note: version === 0x0301 ? 'TLS 1.3 pins this to 1.0 for middleboxes' : undefined },
      { label: 'Length', value: `${length} bytes` },
    ];

    const end = Math.min(body + length, bytes.length);

    if (contentType === 22 && body + 4 <= end) {
      const handshakeType = bytes[body];
      const handshakeLength = (bytes[body + 1] << 16) | u16(bytes, body + 2);
      fields.push({ label: 'Handshake type', value: String(handshakeType), note: HANDSHAKE_TYPES[handshakeType] ?? 'unknown' });
      fields.push({ label: 'Handshake length', value: `${handshakeLength} bytes` });
      if (handshakeType === 1) parseClientHelloBody(bytes, body + 4, end, fields);
      if (handshakeType === 2 && body + 4 + 34 <= end) {
        fields.push({ label: '  Server version', value: versionName(u16(bytes, body + 4)) });
        fields.push({ label: '  Random', value: hex(bytes, body + 6, 32) });
        const sessionIdLength = bytes[body + 38];
        const suiteAt = body + 39 + sessionIdLength;
        if (suiteAt + 1 < end) {
          const code = `0x${hex(bytes, suiteAt, 2)}`;
          fields.push({ label: '  Cipher suite', value: CIPHER_NAMES[code.toLowerCase()] ?? code });
        }
      }
    } else if (contentType === 21 && body + 2 <= end) {
      fields.push({ label: 'Alert level', value: String(bytes[body]), note: ALERT_LEVELS[bytes[body]] ?? 'unknown' });
      fields.push({ label: 'Alert description', value: String(bytes[body + 1]), note: ALERT_DESCRIPTIONS[bytes[body + 1]] ?? 'unknown' });
    } else if (contentType === 23) {
      fields.push({ label: 'Payload', value: `${length} encrypted bytes`, note: 'not readable without the session keys' });
    }

    sections.push({ title: `TLS record ${++index}`, fields, warnings });
    at = body + length;
    if (length === 0) break;
  }

  if (sections.length === 0) throw new Error('A TLS record needs at least 5 bytes');
  return sections;
}

// ─── Dissection ───────────────────────────────────────────────────────────────

/** Parses from the chosen layer downwards, following what each header says. */
export function dissect(input: string, layer: Layer): Dissection {
  const bytes = packetHexToBytes(input);
  const sections: Section[] = [];
  let offset = 0;
  let next: Layer | 'stop' = layer;

  if (next === 'ethernet') {
    const ethernet = parseEthernet(bytes);
    sections.push(ethernet.section);
    offset = ethernet.payloadStart;
    next = ethernet.ethertype === 0x0800 ? 'ipv4' : 'stop';
    if (ethernet.ethertype !== 0x0800 && ethernet.ethertype > 1500) {
      sections[0].warnings.push(`The payload is ${ETHERTYPES[ethernet.ethertype] ?? 'an unknown protocol'}, which this does not dissect.`);
    } else if (next === 'ipv4' && bytes.length - offset < 20) {
      sections[0].warnings.push('The IPv4 header it points to was not included, so the dissection stops here.');
      next = 'stop';
    }
  }

  if (next === 'ipv4') {
    const ip = parseIpv4(bytes, offset);
    sections.push(ip.section);
    offset = ip.payloadStart;
    next = ip.protocol === 6 ? 'tcp' : ip.protocol === 17 ? 'udp' : 'stop';
    if (next === 'stop') {
      ip.section.warnings.push(`Protocol ${ip.protocol} (${IP_PROTOCOLS[ip.protocol] ?? 'unknown'}) is not dissected further.`);
    } else if (bytes.length - offset < (next === 'tcp' ? 20 : 8)) {
      // A header on its own is a normal thing to paste; say what is missing
      // rather than failing on bytes the user never claimed to have.
      ip.section.warnings.push(
        `The ${next.toUpperCase()} header it points to was not included, so the dissection stops here.`,
      );
      next = 'stop';
    }
  }

  if (next === 'tcp') {
    const tcp = parseTcp(bytes, offset);
    sections.push(tcp.section);
    offset = tcp.payloadStart;
    // A TLS record starts with a content type in 20-24 and a plausible version.
    next = tcp.payloadLength >= 5 && bytes[offset] >= 20 && bytes[offset] <= 24 &&
      bytes[offset + 1] === 0x03 ? 'tls' : 'stop';
  } else if (next === 'udp') {
    const udp = parseUdp(bytes, offset);
    sections.push(udp.section);
    offset = udp.payloadStart;
    next = 'stop';
  }

  if (next === 'tls') {
    sections.push(...parseTlsRecords(bytes, offset));
    offset = bytes.length;
  }

  return {
    sections,
    totalBytes: bytes.length,
    remainingHex: offset < bytes.length ? hex(bytes, offset) : '',
  };
}

export function formatDissection(result: Dissection): string {
  const lines: string[] = [];
  for (const section of result.sections) {
    if (lines.length) lines.push('');
    lines.push(`── ${section.title} ──`);
    const width = Math.max(...section.fields.map((f) => f.label.length), 0);
    for (const field of section.fields) {
      lines.push(`${field.label.padEnd(width)}  ${field.value}${field.note ? `  (${field.note})` : ''}`);
    }
    for (const warning of section.warnings) lines.push(`! ${warning}`);
  }
  if (result.remainingHex) {
    lines.push('', `── Remaining payload (${result.remainingHex.length / 2} bytes) ──`);
    lines.push(result.remainingHex.match(/.{1,64}/g)?.join('\n') ?? result.remainingHex);
  }
  return lines.join('\n');
}

export function dissectText(input: string, layer: Layer): string {
  return formatDissection(dissect(input, layer));
}

// ─── Samples ──────────────────────────────────────────────────────────────────

export const SAMPLES: Record<Layer, string> = {
  // A TCP SYN to port 443, inside IPv4, inside an Ethernet II frame.
  ethernet:
    '// Ethernet II + IPv4 + TCP SYN to 93.184.216.34:443\n' +
    'aa bb cc dd ee ff 11 22 33 44 55 66 08 00\n' +
    '45 00 00 3c 1c 46 40 00 40 06 a6 ec c0 a8 00 68\n' +
    '5d b8 d8 22\n' +
    'c3 50 01 bb 00 00 00 01 00 00 00 00 a0 02 fa f0\n' +
    'f7 6c 00 00 02 04 05 b4 04 02 08 0a 00 0f 42 40\n' +
    '00 00 00 00 01 03 03 07',
  ipv4:
    '// IPv4 header carrying UDP to port 53\n' +
    '45 00 00 3c 1c 46 40 00 40 11 a6 e1 c0 a8 00 68\n' +
    '08 08 08 08\n' +
    'd4 31 00 35 00 28 00 00',
  tcp:
    '// TCP header: SYN to port 443 with MSS, SACK, timestamps and window scale\n' +
    'c3 50 01 bb 00 00 00 01 00 00 00 00 a0 02 fa f0\n' +
    'f7 6c 00 00 02 04 05 b4 04 02 08 0a 00 0f 42 40\n' +
    '00 00 00 00 01 03 03 07',
  udp:
    '// UDP header: a DNS query, 32 bytes of payload\n' +
    'd4 31 00 35 00 28 00 00',
  tls:
    '// TLS 1.2 record: an Alert, close_notify\n' +
    '15 03 03 00 02 01 00',
};
