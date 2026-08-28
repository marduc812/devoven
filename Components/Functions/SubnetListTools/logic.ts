export type SubnetInfo = {
  index: number;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
  prefixLength: number;
};

export type SubnetListResult = {
  originalCidr: string;
  originalPrefix: number;
  splitPrefix: number;
  subnets: SubnetInfo[];
  subnetCount: number;
};

function ipToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IP address');
  let result = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) throw new Error('Invalid IP address');
    result = (result * 256) + octet;
  }
  return result >>> 0;
}

function intToIp(n: number): string {
  const n2 = n >>> 0;
  return [
    (n2 >>> 24) & 0xff,
    (n2 >>> 16) & 0xff,
    (n2 >>> 8) & 0xff,
    n2 & 0xff,
  ].join('.');
}

export function generateSubnetList(cidr: string, splitPrefix: number): SubnetListResult {
  const parts = cidr.trim().split('/');
  if (parts.length !== 2) throw new Error('Invalid CIDR notation. Use format like 192.168.1.0/24');

  const ip = parts[0];
  const originalPrefix = parseInt(parts[1], 10);

  if (isNaN(originalPrefix) || originalPrefix < 0 || originalPrefix > 32) {
    throw new Error('Prefix length must be between 0 and 32');
  }
  if (splitPrefix <= originalPrefix || splitPrefix > 32) {
    throw new Error('Split prefix must be greater than original prefix and at most 32');
  }

  const ipInt = ipToInt(ip);
  const originalMask = originalPrefix === 0 ? 0 : (0xffffffff << (32 - originalPrefix)) >>> 0;
  const networkInt = (ipInt & originalMask) >>> 0;

  const splitMask = splitPrefix === 0 ? 0 : (0xffffffff << (32 - splitPrefix)) >>> 0;
  const subnetSize = splitPrefix === 32 ? 1 : Math.pow(2, 32 - splitPrefix);
  const subnetCount = Math.pow(2, splitPrefix - originalPrefix);

  if (subnetCount > 1024) {
    throw new Error('Too many subnets to display (max 1024). Use a smaller split prefix difference.');
  }

  const subnets: SubnetInfo[] = [];

  for (let i = 0; i < subnetCount; i++) {
    const subnetNetwork = (networkInt + i * subnetSize) >>> 0;
    const subnetBroadcast = (subnetNetwork + subnetSize - 1) >>> 0;
    const firstHost = splitPrefix < 31 ? (subnetNetwork + 1) >>> 0 : subnetNetwork;
    const lastHost = splitPrefix < 31 ? (subnetBroadcast - 1) >>> 0 : subnetBroadcast;
    const usableHosts = splitPrefix >= 31 ? (splitPrefix === 32 ? 1 : 2) : subnetSize - 2;

    subnets.push({
      index: i + 1,
      network: intToIp(subnetNetwork) + '/' + splitPrefix,
      broadcast: intToIp(subnetBroadcast),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      usableHosts: Math.max(0, usableHosts),
      prefixLength: splitPrefix,
    });
  }

  return {
    originalCidr: intToIp(networkInt) + '/' + originalPrefix,
    originalPrefix,
    splitPrefix,
    subnets,
    subnetCount,
  };
}

