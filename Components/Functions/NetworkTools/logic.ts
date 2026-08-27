// ─── IPv4 ↔ Integer ──────────────────────────────────────────────────────────

export function ipv4ToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4 address');
  return parts.reduce((acc, part) => {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) throw new Error('Invalid octet: ' + part);
    return (acc << 8) + n;
  }, 0) >>> 0;
}

export function intToIpv4(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) throw new Error('Invalid integer');
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

// ─── IPv4 ↔ Binary ───────────────────────────────────────────────────────────

export function ipv4ToBinary(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4 address');
  return parts.map(p => {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) throw new Error('Invalid octet');
    return n.toString(2).padStart(8, '0');
  }).join('.');
}

export function binaryToIpv4(bin: string): string {
  const octets = bin.split('.');
  if (octets.length !== 4) throw new Error('Expected 4 binary octets separated by dots');
  return octets.map(o => {
    if (!/^[01]{8}$/.test(o)) throw new Error('Each octet must be 8 bits');
    return parseInt(o, 2).toString();
  }).join('.');
}

// ─── CIDR Calculator ─────────────────────────────────────────────────────────

export function parseCidr(cidr: string): {
  network: string;
  broadcast: string;
  subnetMask: string;
  wildcardMask: string;
  totalHosts: number;
  usableHosts: number;
  firstHost: string;
  lastHost: string;
  prefixLength: number;
} {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  if (!ip || isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('Invalid CIDR notation');

  const ipInt = ipv4ToInt(ip);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | (~mask >>> 0)) >>> 0;

  return {
    network: intToIpv4(networkInt),
    broadcast: intToIpv4(broadcastInt),
    subnetMask: intToIpv4(mask),
    wildcardMask: intToIpv4(~mask >>> 0),
    totalHosts: Math.pow(2, 32 - prefix),
    usableHosts: prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2,
    firstHost: prefix >= 31 ? intToIpv4(networkInt) : intToIpv4(networkInt + 1),
    lastHost: prefix >= 31 ? intToIpv4(broadcastInt) : intToIpv4(broadcastInt - 1),
    prefixLength: prefix,
  };
}

// ─── IPv6 Expander / Compressor ───────────────────────────────────────────────

export function expandIpv6(input: string): string {
  let addr = input.trim().toLowerCase();
  if (addr.includes('::')) {
    const [left, right] = addr.split('::');
    const leftGroups = left ? left.split(':') : [];
    const rightGroups = right ? right.split(':') : [];
    const missing = 8 - leftGroups.length - rightGroups.length;
    const middle = Array(missing).fill('0000');
    addr = [...leftGroups, ...middle, ...rightGroups].join(':');
  }
  return addr.split(':').map(g => g.padStart(4, '0')).join(':');
}

export function compressIpv6(input: string): string {
  const expanded = expandIpv6(input);
  const groups = expanded.split(':').map(g => g.replace(/^0+/, '') || '0');
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (curStart === -1) { curStart = i; curLen = 0; }
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else {
      curStart = -1;
    }
  }
  if (bestLen > 1) {
    const left = groups.slice(0, bestStart).join(':');
    const right = groups.slice(bestStart + bestLen).join(':');
    return (left ? left + '::' : '::') + right;
  }
  return groups.join(':');
}

// ─── URL Parser ───────────────────────────────────────────────────────────────

export type ParsedUrl = {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: { key: string; value: string }[];
};

export function parseUrl(input: string): ParsedUrl {
  let urlStr = input.trim();
  if (!urlStr.includes('://')) urlStr = 'https://' + urlStr;
  const u = new URL(urlStr);
  const params: { key: string; value: string }[] = [];
  u.searchParams.forEach((value, key) => params.push({ key, value }));
  return {
    protocol: u.protocol,
    username: u.username,
    password: u.password,
    hostname: u.hostname,
    port: u.port,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    params,
  };
}

export function buildUrl(parts: Partial<ParsedUrl>): string {
  const u = new URL((parts.protocol || 'https:') + '//' + (parts.hostname || 'example.com'));
  if (parts.pathname) u.pathname = parts.pathname;
  if (parts.port) u.port = parts.port;
  if (parts.hash) u.hash = parts.hash;
  if (parts.params) parts.params.forEach(p => u.searchParams.append(p.key, p.value));
  return u.toString();
}

// ─── User Agent Parser ────────────────────────────────────────────────────────

export type ParsedUserAgent = {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: 'mobile' | 'tablet' | 'desktop' | 'bot';
  engine: string;
};

export function parseUserAgent(ua: string): ParsedUserAgent {
  if (!ua.trim()) throw new Error('Empty user agent');

  let device: ParsedUserAgent['device'] = 'desktop';
  if (/bot|crawl|spider|slurp|search/i.test(ua)) device = 'bot';
  else if (/tablet|ipad/i.test(ua)) device = 'tablet';
  else if (/mobile|android|iphone|ipod|windows phone/i.test(ua)) device = 'mobile';

  let os = 'Unknown', osVersion = '';
  if (/windows nt ([\d.]+)/i.test(ua)) {
    const m = ua.match(/windows nt ([\d.]+)/i)!;
    os = 'Windows';
    const versions: Record<string, string> = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP' };
    osVersion = versions[m[1]] ?? m[1];
  } else if (/mac os x ([\d_]+)/i.test(ua)) {
    const m = ua.match(/mac os x ([\d_]+)/i)!;
    os = 'macOS'; osVersion = m[1].replace(/_/g, '.');
  } else if (/android ([\d.]+)/i.test(ua)) {
    const m = ua.match(/android ([\d.]+)/i)!;
    os = 'Android'; osVersion = m[1];
  } else if (/iphone os ([\d_]+)/i.test(ua)) {
    const m = ua.match(/iphone os ([\d_]+)/i)!;
    os = 'iOS'; osVersion = m[1].replace(/_/g, '.');
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  let engine = 'Unknown';
  if (/trident/i.test(ua)) engine = 'Trident';
  else if (/gecko/i.test(ua) && !/webkit/i.test(ua)) engine = 'Gecko';
  else if (/webkit/i.test(ua)) engine = /chrome/i.test(ua) ? 'Blink' : 'WebKit';

  let browser = 'Unknown', browserVersion = '';
  if (/edg\/([\d.]+)/i.test(ua)) {
    browser = 'Edge'; browserVersion = ua.match(/edg\/([\d.]+)/i)![1];
  } else if (/opr\/([\d.]+)/i.test(ua)) {
    browser = 'Opera'; browserVersion = ua.match(/opr\/([\d.]+)/i)![1];
  } else if (/chrome\/([\d.]+)/i.test(ua)) {
    browser = 'Chrome'; browserVersion = ua.match(/chrome\/([\d.]+)/i)![1];
  } else if (/firefox\/([\d.]+)/i.test(ua)) {
    browser = 'Firefox'; browserVersion = ua.match(/firefox\/([\d.]+)/i)![1];
  } else if (/safari\/([\d.]+)/i.test(ua) && /version\/([\d.]+)/i.test(ua)) {
    browser = 'Safari'; browserVersion = ua.match(/version\/([\d.]+)/i)![1];
  } else if (/msie ([\d.]+)/i.test(ua)) {
    browser = 'Internet Explorer'; browserVersion = ua.match(/msie ([\d.]+)/i)![1];
  }

  return { browser, browserVersion, os, osVersion, device, engine };
}

export function formatParsedUserAgent(parsed: ParsedUserAgent): string {
  return [
    `Browser:   ${parsed.browser} ${parsed.browserVersion}`.trim(),
    `OS:        ${parsed.os} ${parsed.osVersion}`.trim(),
    `Device:    ${parsed.device}`,
    `Engine:    ${parsed.engine}`,
  ].join('\n');
}
