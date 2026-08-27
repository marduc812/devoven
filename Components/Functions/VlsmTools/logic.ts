// VLSM Calculator — pure TypeScript, no browser APIs

export type VlsmSubnet = {
  label: string;
  requiredHosts: number;
  allocatedHosts: number;
  prefixLength: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  addressRange: string;
};

export type VlsmResult = {
  baseNetwork: string;
  basePrefix: number;
  totalAddresses: number;
  subnets: VlsmSubnet[];
  usedAddresses: number;
  remainingAddresses: number;
  error?: string;
};

function ipToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IP address: ' + ip);
  let result = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) throw new Error('Invalid octet: ' + parts[i]);
    result = (result * 256) + octet;
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

function prefixToMask(prefix: number): number {
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function maskToString(maskInt: number): string {
  return intToIp(maskInt);
}

function requiredPrefixForHosts(hosts: number): number {
  // Need hosts + 2 addresses (network + broadcast) for prefix < 31
  if (hosts <= 0) throw new Error('Host count must be positive');
  if (hosts === 1) return 32; // /32 point-to-point
  if (hosts === 2) return 30; // /30 point-to-point with network and broadcast
  // Find smallest prefix that fits hosts + 2
  let bits = 1;
  while (Math.pow(2, bits) - 2 < hosts) {
    bits++;
    if (bits > 30) throw new Error('Host count too large for IPv4 (' + hosts + ')');
  }
  return 32 - bits;
}

export function calculateVlsm(networkCidr: string, hostRequirementsInput: string): VlsmResult {
  // Parse base network
  const cidrParts = networkCidr.trim().split('/');
  if (cidrParts.length !== 2) {
    return { baseNetwork: networkCidr, basePrefix: 0, totalAddresses: 0, subnets: [], usedAddresses: 0, remainingAddresses: 0, error: 'Invalid CIDR format. Use x.x.x.x/prefix' };
  }
  const baseIp = cidrParts[0];
  const basePrefix = parseInt(cidrParts[1], 10);

  if (isNaN(basePrefix) || basePrefix < 0 || basePrefix > 30) {
    return { baseNetwork: networkCidr, basePrefix: 0, totalAddresses: 0, subnets: [], usedAddresses: 0, remainingAddresses: 0, error: 'Prefix must be 0-30' };
  }

  let baseInt: number;
  try {
    baseInt = ipToInt(baseIp);
  } catch (e) {
    return { baseNetwork: networkCidr, basePrefix, totalAddresses: 0, subnets: [], usedAddresses: 0, remainingAddresses: 0, error: 'Invalid IP address' };
  }

  const baseMask = prefixToMask(basePrefix);
  const networkInt = (baseInt & baseMask) >>> 0;
  const totalAddresses = Math.pow(2, 32 - basePrefix);
  const baseNetworkStr = intToIp(networkInt) + '/' + basePrefix;

  // Parse host requirements
  const lines = hostRequirementsInput.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  if (lines.length === 0) {
    return { baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets: [], usedAddresses: 0, remainingAddresses: totalAddresses, error: 'Enter at least one host requirement' };
  }

  type SubnetReq = { label: string; hosts: number };
  const requirements: SubnetReq[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Support formats: "50" or "Office: 50" or "Subnet A - 50 hosts"
    const match = line.match(/(\d+)/);
    if (!match) {
      return { baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets: [], usedAddresses: 0, remainingAddresses: totalAddresses, error: 'Cannot parse line ' + (i + 1) + ': "' + line + '". Enter number of hosts.' };
    }
    const hosts = parseInt(match[1], 10);
    if (hosts <= 0) {
      return { baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets: [], usedAddresses: 0, remainingAddresses: totalAddresses, error: 'Host count must be positive (line ' + (i + 1) + ')' };
    }
    const labelMatch = line.match(/^([^0-9]+)/);
    const label = labelMatch ? labelMatch[1].trim().replace(/[:\-]+$/, '').trim() : 'Subnet ' + (i + 1);
    requirements.push({ label: label || 'Subnet ' + (i + 1), hosts });
  }

  // Sort by hosts descending (largest first — VLSM best practice)
  const sorted = requirements.slice().sort(function(a, b) { return b.hosts - a.hosts; });

  const subnets: VlsmSubnet[] = [];
  let currentInt = networkInt;
  const endInt = (networkInt + totalAddresses) >>> 0;

  for (let i = 0; i < sorted.length; i++) {
    const req = sorted[i];
    let prefix: number;
    try {
      prefix = requiredPrefixForHosts(req.hosts);
    } catch (e) {
      return { baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets: [], usedAddresses: 0, remainingAddresses: totalAddresses, error: String(e) };
    }

    const subnetSize = Math.pow(2, 32 - prefix);
    const subnetMaskInt = prefixToMask(prefix);

    // Align currentInt to subnet boundary
    const aligned = (Math.ceil(currentInt / subnetSize) * subnetSize) >>> 0;
    const subnetStart = aligned;
    const subnetEnd = (subnetStart + subnetSize - 1) >>> 0;

    if (subnetEnd >= endInt || subnetStart >= endInt) {
      return {
        baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets,
        usedAddresses: subnets.reduce(function(acc, s) { return acc + Math.pow(2, 32 - s.prefixLength); }, 0),
        remainingAddresses: 0,
        error: 'Not enough address space for subnet ' + (i + 1) + ' (' + req.hosts + ' hosts needed)'
      };
    }

    const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : subnetSize - 2;
    const firstHost = prefix < 31 ? (subnetStart + 1) >>> 0 : subnetStart;
    const lastHost = prefix < 31 ? (subnetEnd - 1) >>> 0 : subnetEnd;

    subnets.push({
      label: req.label,
      requiredHosts: req.hosts,
      allocatedHosts: usable,
      prefixLength: prefix,
      subnetMask: maskToString(subnetMaskInt),
      networkAddress: intToIp(subnetStart) + '/' + prefix,
      broadcastAddress: intToIp(subnetEnd),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      addressRange: intToIp(firstHost) + ' - ' + intToIp(lastHost),
    });

    currentInt = (subnetEnd + 1) >>> 0;
  }

  const usedAddresses = subnets.reduce(function(acc, s) { return acc + Math.pow(2, 32 - s.prefixLength); }, 0);
  const remainingAddresses = totalAddresses - usedAddresses;

  return { baseNetwork: baseNetworkStr, basePrefix, totalAddresses, subnets, usedAddresses, remainingAddresses };
}
