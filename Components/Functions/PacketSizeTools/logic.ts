// ─── Network Packet Size Calculator ──────────────────────────────────────────

export type Protocol = 'ethernet' | 'ipv4' | 'ipv6' | 'tcp' | 'udp' | 'http' | 'https';

export interface HeaderSize {
  protocol: string;
  size: number;
  description: string;
}

export interface PacketResult {
  payloadSize: number;
  headers: HeaderSize[];
  totalSize: number;
  mtuBytes: number;
  packetsNeeded: number;
  perPacketPayload: number;
  efficiency: number; // payload/total %
  overhead: number;
  fragments: FragmentInfo[];
}

export interface FragmentInfo {
  fragmentNumber: number;
  payloadBytes: number;
  totalBytes: number;
  offset: number;
}

export const HEADER_SIZES: Record<Protocol, HeaderSize> = {
  ethernet: { protocol: 'Ethernet II', size: 14, description: '6B dst MAC + 6B src MAC + 2B EtherType' },
  ipv4: { protocol: 'IPv4', size: 20, description: '20B minimum header (no options)' },
  ipv6: { protocol: 'IPv6', size: 40, description: 'Fixed 40B header' },
  tcp: { protocol: 'TCP', size: 20, description: '20B minimum header (no options)' },
  udp: { protocol: 'UDP', size: 8, description: '8B header (src/dst port + length + checksum)' },
  http: { protocol: 'HTTP/1.1', size: 200, description: '~200B estimated headers (typical GET request)' },
  https: { protocol: 'TLS Record', size: 29, description: '5B record header + up to 24B overhead (MAC + padding)' },
};

export const PROTOCOL_STACKS: Record<string, Protocol[]> = {
  'UDP/IPv4/Ethernet': ['ethernet', 'ipv4', 'udp'],
  'TCP/IPv4/Ethernet': ['ethernet', 'ipv4', 'tcp'],
  'UDP/IPv6/Ethernet': ['ethernet', 'ipv6', 'udp'],
  'TCP/IPv6/Ethernet': ['ethernet', 'ipv6', 'tcp'],
  'HTTP/TCP/IPv4/Ethernet': ['ethernet', 'ipv4', 'tcp', 'http'],
  'HTTPS/TCP/IPv4/Ethernet': ['ethernet', 'ipv4', 'tcp', 'https'],
};

export const STANDARD_MTUS: Record<string, number> = {
  'Ethernet (standard)': 1500,
  'Ethernet (jumbo frame)': 9000,
  'PPPoE': 1492,
  'VPN (typical)': 1400,
  'Loopback': 65535,
  'Wi-Fi (802.11)': 2304,
};

export function calculatePacketSize(
  payloadBytes: number,
  protocols: Protocol[],
  mtu: number,
): PacketResult {
  if (payloadBytes < 0) throw new Error('Payload size must be non-negative');
  if (mtu < 1) throw new Error('MTU must be at least 1');

  const headers = protocols.map(p => HEADER_SIZES[p]);
  const headerTotal = headers.reduce((sum, h) => sum + h.size, 0);
  const totalSize = payloadBytes + headerTotal;

  // For fragmentation: the transport overhead (headers above IP) is per-packet,
  // but IP payload is fragmented. We calculate based on available IP payload per fragment.
  const ethernetIdx = protocols.indexOf('ethernet');
  const ipHeaderSize = protocols.includes('ipv4') ? 20 : protocols.includes('ipv6') ? 40 : 0;
  const ethernetHeaderSize = ethernetIdx >= 0 ? HEADER_SIZES['ethernet'].size : 0;
  const maxIpPayload = mtu - ethernetHeaderSize - ipHeaderSize;

  // Transport headers (TCP/UDP) + app headers
  const transportAndAbove = protocols
    .filter(p => p !== 'ethernet' && p !== 'ipv4' && p !== 'ipv6')
    .reduce((sum, p) => sum + HEADER_SIZES[p].size, 0);

  const perPacketPayload = Math.max(1, maxIpPayload - transportAndAbove);
  const packetsNeeded = totalSize <= mtu ? 1 : Math.ceil(payloadBytes / perPacketPayload);
  const efficiency = totalSize > 0 ? Math.round((payloadBytes / totalSize) * 1000) / 10 : 0;
  const overhead = totalSize - payloadBytes;

  // Build fragment info
  const fragments: FragmentInfo[] = [];
  if (totalSize > mtu) {
    let remaining = payloadBytes;
    let offset = 0;
    let fragNum = 1;
    while (remaining > 0) {
      const thisPayload = Math.min(remaining, perPacketPayload);
      const thisTotal = thisPayload + (fragNum === 1 ? headerTotal : ipHeaderSize + ethernetHeaderSize);
      fragments.push({
        fragmentNumber: fragNum,
        payloadBytes: thisPayload,
        totalBytes: thisTotal,
        offset,
      });
      offset += thisPayload;
      remaining -= thisPayload;
      fragNum++;
      if (fragments.length > 20) break; // cap display
    }
  }

  return {
    payloadSize: payloadBytes,
    headers,
    totalSize,
    mtuBytes: mtu,
    packetsNeeded,
    perPacketPayload,
    efficiency,
    overhead,
    fragments,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
