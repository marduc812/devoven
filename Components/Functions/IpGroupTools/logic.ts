// ─── Group IP addresses ──────────────────────────────────────────────────────
// Collapse a list of IPv4 addresses and ranges into the smallest set of CIDR
// blocks that covers exactly the same addresses. The list a firewall log gives
// you is not the list a firewall rule wants.

export type IpRange = { start: number; end: number };

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function ipToInt(address: string): number {
  const match = address.trim().match(IPV4);
  if (!match) throw new Error(`"${address}" is not an IPv4 address`);
  let value = 0;
  for (let i = 1; i <= 4; i++) {
    const octet = Number(match[i]);
    if (octet > 255) throw new Error(`"${address}" has an octet above 255`);
    value = value * 256 + octet;
  }
  return value >>> 0;
}

export function intToIp(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join('.');
}

/**
 * Reads one line: a bare address, a CIDR block, a `start-end` range, or an
 * address with a netmask. Blank lines and `#` comments are skipped by the caller.
 */
export function parseEntry(line: string): IpRange {
  const text = line.trim();

  const cidr = text.match(/^(\S+)\/(\d{1,2})$/);
  if (cidr) {
    const prefix = Number(cidr[2]);
    if (prefix > 32) throw new Error(`"${text}" has a prefix above /32`);
    const base = ipToInt(cidr[1]);
    const size = prefix === 0 ? 0x100000000 : 2 ** (32 - prefix);
    const start = prefix === 0 ? 0 : (base & (-1 << (32 - prefix))) >>> 0;
    return { start, end: start + size - 1 };
  }

  const masked = text.match(/^(\S+)[/\s]+(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (masked) {
    const mask = ipToInt(masked[2]);
    // A netmask is contiguous ones then zeros; anything else is a wildcard.
    const inverted = (~mask) >>> 0;
    if (((inverted + 1) & inverted) !== 0) throw new Error(`"${masked[2]}" is not a contiguous netmask`);
    const start = (ipToInt(masked[1]) & mask) >>> 0;
    return { start, end: (start + inverted) >>> 0 };
  }

  const range = text.match(/^(\S+)\s*-\s*(\S+)$/);
  if (range) {
    const start = ipToInt(range[1]);
    const end = ipToInt(range[2]);
    if (end < start) throw new Error(`"${text}" ends before it starts`);
    return { start, end };
  }

  const single = ipToInt(text);
  return { start: single, end: single };
}

/** Sorts and merges the ranges, joining any that touch or overlap. */
export function mergeRanges(ranges: IpRange[]): IpRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: IpRange[] = [];
  for (const range of sorted) {
    const last = out[out.length - 1];
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
      continue;
    }
    out.push({ ...range });
  }
  return out;
}

/**
 * The classic greedy split: at each step take the largest aligned block that
 * starts where we are and does not overshoot the end of the range.
 */
export function rangeToCidrs(range: IpRange): string[] {
  const out: string[] = [];
  let start = range.start;
  const end = range.end;

  while (start <= end) {
    // The largest block this address can start, from its trailing zero bits.
    let maxSize = start === 0 ? 0x100000000 : (start & -start) >>> 0;
    const remaining = end - start + 1;
    while (maxSize > remaining) maxSize /= 2;
    const prefix = 32 - Math.log2(maxSize);
    out.push(maxSize === 1 ? `${intToIp(start)}/32` : `${intToIp(start)}/${prefix}`);
    start += maxSize;
    if (start > 0xffffffff) break;
  }
  return out;
}

export type GroupOptions = {
  /** Do not merge below this prefix, so nothing wider than a /24 is produced. */
  minPrefix?: number;
  /** Show each block's range and size alongside it. */
  detailed?: boolean;
  /** Emit merged ranges as `start-end` instead of CIDR blocks. */
  asRanges?: boolean;
};

export type GroupResult = {
  lines: string[];
  inputCount: number;
  addressCount: number;
  blockCount: number;
  errors: string[];
};

export function groupIps(input: string, options: GroupOptions = {}): GroupResult {
  const errors: string[] = [];
  const ranges: IpRange[] = [];
  let inputCount = 0;

  const entries = input
    .split(/[\n,;]+/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean);

  if (entries.length === 0) throw new Error('Paste a list of IP addresses');

  for (const entry of entries) {
    try {
      ranges.push(parseEntry(entry));
      inputCount++;
    } catch (e: unknown) {
      errors.push(e instanceof Error ? e.message : `Cannot read "${entry}"`);
    }
  }
  if (ranges.length === 0) throw new Error(errors[0] ?? 'No addresses found');

  const merged = mergeRanges(ranges);
  const addressCount = merged.reduce((sum, r) => sum + (r.end - r.start + 1), 0);

  const lines: string[] = [];
  let blockCount = 0;

  for (const range of merged) {
    if (options.asRanges) {
      lines.push(`${intToIp(range.start)}-${intToIp(range.end)}`);
      blockCount++;
      continue;
    }
    for (const cidr of rangeToCidrs(range)) {
      blockCount++;
      if (!options.detailed) {
        lines.push(cidr);
        continue;
      }
      const prefix = Number(cidr.split('/')[1]);
      const size = prefix === 0 ? 0x100000000 : 2 ** (32 - prefix);
      const start = ipToInt(cidr.split('/')[0]);
      lines.push(`${cidr.padEnd(20)} ${intToIp(start)} - ${intToIp(start + size - 1)}  (${size} addresses)`);
    }
  }

  // Widening happens after the split, so a run of /32s in the same /24 becomes
  // one line without pulling in neighbours the input never mentioned.
  if (options.minPrefix !== undefined && !options.asRanges) {
    const limit = options.minPrefix;
    const widened = new Set<string>();
    for (const range of merged) {
      for (const cidr of rangeToCidrs(range)) {
        const [address, prefixText] = cidr.split('/');
        const prefix = Number(prefixText);
        if (prefix <= limit) { widened.add(cidr); continue; }
        const base = (ipToInt(address) & (-1 << (32 - limit))) >>> 0;
        widened.add(`${intToIp(base)}/${limit}`);
      }
    }
    const list = [...widened].sort((a, b) => ipToInt(a.split('/')[0]) - ipToInt(b.split('/')[0]));
    return {
      lines: list,
      inputCount,
      addressCount,
      blockCount: list.length,
      errors,
    };
  }

  return { lines, inputCount, addressCount, blockCount, errors };
}

export function formatGroupResult(result: GroupResult): string {
  const lines = [...result.lines];
  if (result.errors.length) {
    lines.push('', `${result.errors.length} line(s) skipped:`);
    for (const error of result.errors.slice(0, 10)) lines.push(`  ${error}`);
  }
  return lines.join('\n');
}

/** The pipeline form: a list in, one CIDR block per line out. */
export function groupIpsText(input: string, minPrefix?: number): string {
  return groupIps(input, { minPrefix }).lines.join('\n');
}

export const IP_SAMPLE = [
  '192.168.1.1',
  '192.168.1.2',
  '192.168.1.3',
  '192.168.1.4',
  '10.0.0.0/30',
  '10.0.0.4',
  '10.0.0.5',
  '203.0.113.10-203.0.113.20',
  '172.16.5.0 255.255.255.0',
].join('\n');
