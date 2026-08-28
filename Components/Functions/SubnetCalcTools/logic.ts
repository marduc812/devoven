export type SubnetCalcResult = {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  prefixLength: number;
  ipClass: string;
  binaryMask: string;
};

function ipToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IP address');
  let result = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) throw new Error('Invalid IP octet: ' + parts[i]);
    result = (result * 256 + octet) >>> 0;
  }
  return result >>> 0;
}

function intToIp(n: number): string {
  const u = n >>> 0;
  return [
    (u >>> 24) & 0xff,
    (u >>> 16) & 0xff,
    (u >>> 8) & 0xff,
    u & 0xff,
  ].join('.');
}

function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (Multicast)';
  return 'E (Reserved)';
}

export function calcSubnet(cidr: string): SubnetCalcResult {
  const trimmed = cidr.trim();
  if (!trimmed) throw new Error('Please enter a CIDR notation (e.g. 192.168.1.0/24)');

  const parts = trimmed.split('/');
  if (parts.length !== 2) throw new Error('Invalid CIDR. Use format like 192.168.1.0/24');

  const ip = parts[0].trim();
  const prefix = parseInt(parts[1].trim(), 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('Prefix length must be between 0 and 32');
  }

  const ipInt = ipToInt(ip);
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const wildcard = (~mask) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | wildcard) >>> 0;

  const totalHosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(0, totalHosts - 2);
  const firstHostInt = prefix < 31 ? (networkInt + 1) >>> 0 : networkInt;
  const lastHostInt = prefix < 31 ? (broadcastInt - 1) >>> 0 : broadcastInt;

  const firstOctet = (ipInt >>> 24) & 0xff;

  // Build binary mask string
  const binaryParts: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const octet = (mask >>> (i * 8)) & 0xff;
    binaryParts.push(octet.toString(2).padStart(8, '0'));
  }
  const binaryMask = binaryParts.join('.');

  return {
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    totalHosts,
    usableHosts,
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(wildcard),
    prefixLength: prefix,
    ipClass: getIpClass(firstOctet),
    binaryMask,
  };
}
