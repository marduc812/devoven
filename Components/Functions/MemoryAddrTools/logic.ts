export interface MemoryAddrResult {
  address: string;       // hex
  addressDecimal: string;
  addressBinary: string;
  pageInfo: PageInfo[];
  alignmentInfo: AlignmentInfo[];
  error?: string;
}

export interface DistanceResult {
  distance: string;       // hex
  distanceDecimal: string;
  signedDistance: string;
  human: string;          // e.g. "4 KB"
  direction: 'above' | 'below' | 'same';
  error?: string;
}

export interface PageInfo {
  pageSize: string;
  pageSizeBytes: number;
  pageNumber: string;
  offset: string;
  offsetDecimal: number;
  pageStart: string;      // hex address of the page this address falls in
}

export interface AlignmentInfo {
  alignment: number;
  aligned: boolean;
  alignedDown: string;    // hex, previous boundary at or below the address
  alignedUp: string;      // hex, next boundary at or above the address
  toNextBoundary: number; // bytes of padding needed to reach alignedUp
}

// Safe 32-bit arithmetic only — no BigInt
// Returns null if value exceeds 32-bit unsigned range
function parseHexOrDec(s: string): number | null {
  const trimmed = s.trim().replace(/_/g, '');
  if (!trimmed) return null;
  let val: number;
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    // explicit hex prefix
    const hexPart = trimmed.slice(2);
    if (!/^[0-9A-Fa-f]+$/.test(hexPart)) return null;
    val = parseInt(hexPart, 16);
  } else if (/^[0-9]+$/.test(trimmed)) {
    // pure decimal (digits only)
    val = parseInt(trimmed, 10);
  } else {
    // anything else is invalid (e.g. 'abc' without 0x prefix)
    return null;
  }
  if (isNaN(val)) return null;
  if (val < 0 || val > 4294967295) return null; // 2^32 - 1
  return val;
}

function toHex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(8, '0');
}

function toBinary(n: number): string {
  return n.toString(2).padStart(32, '0');
}

function toDecimal(n: number): string {
  return n.toString(10);
}

const PAGE_SIZES: Array<{ label: string; bytes: number }> = [
  { label: '4 KB', bytes: 4096 },
  { label: '64 KB', bytes: 65536 },
  { label: '2 MB', bytes: 2097152 },
  { label: '1 GB', bytes: 1073741824 },
];

const ALIGNMENTS = [1, 2, 4, 8, 16, 64, 4096];

/** Byte counts as the familiar power-of-two units, e.g. 4096 -> "4 KB". */
export function humanBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${rounded} ${units[unit]}`;
}

export function calculateAddress(baseInput: string, offsetInput: string): MemoryAddrResult {
  const base = parseHexOrDec(baseInput);
  if (base === null) {
    return {
      address: '', addressDecimal: '', addressBinary: '',
      pageInfo: [], alignmentInfo: [],
      error: 'Invalid base address. Enter hex (0x...) or decimal.',
    };
  }

  const offset = offsetInput.trim() ? parseHexOrDec(offsetInput) : 0;
  if (offset === null) {
    return {
      address: '', addressDecimal: '', addressBinary: '',
      pageInfo: [], alignmentInfo: [],
      error: 'Invalid offset. Enter hex (0x...) or decimal.',
    };
  }

  // Use modulo to stay unsigned 32-bit (avoid signed bitwise &)
  const result = (base + offset) % 4294967296;

  const pageInfo: PageInfo[] = PAGE_SIZES.map(ps => {
    const pageNum = Math.floor(result / ps.bytes);
    const pageOffset = result % ps.bytes;
    return {
      pageSize: ps.label,
      pageSizeBytes: ps.bytes,
      pageNumber: toHex(pageNum),
      offset: toHex(pageOffset),
      offsetDecimal: pageOffset,
      pageStart: toHex(pageNum * ps.bytes),
    };
  });

  const alignmentInfo: AlignmentInfo[] = ALIGNMENTS.map(a => {
    const remainder = result % a;
    const alignedDown = result - remainder;
    const toNextBoundary = remainder === 0 ? 0 : a - remainder;
    return {
      alignment: a,
      aligned: remainder === 0,
      alignedDown: toHex(alignedDown),
      alignedUp: toHex(alignedDown + (remainder === 0 ? 0 : a)),
      toNextBoundary,
    };
  });

  return {
    address: toHex(result),
    addressDecimal: toDecimal(result),
    addressBinary: toBinary(result),
    pageInfo,
    alignmentInfo,
  };
}

export function calculateDistance(addr1Input: string, addr2Input: string): DistanceResult {
  const a1 = parseHexOrDec(addr1Input);
  const a2 = parseHexOrDec(addr2Input);

  if (a1 === null || a2 === null) {
    return {
      distance: '', distanceDecimal: '', signedDistance: '',
      human: '', direction: 'same',
      error: 'Invalid address. Enter hex (0x...) or decimal.',
    };
  }

  const raw = a2 - a1;
  const abs = Math.abs(raw);
  const sign = raw < 0 ? '-' : '+';

  return {
    distance: toHex(abs),
    distanceDecimal: abs.toString(),
    signedDistance: sign + abs.toString(),
    human: humanBytes(abs),
    direction: raw > 0 ? 'above' : raw < 0 ? 'below' : 'same',
  };
}

export function formatBinary(bin: string): string {
  // Group by 4 bits with spaces for readability
  return bin.replace(/(.{4})/g, '$1 ').trim();
}
