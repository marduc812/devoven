// ─── Timestamps hidden inside identifiers ────────────────────────────────────
// Two values that carry a creation time in a shape nothing else reads: a
// MongoDB ObjectId and a Windows FILETIME.

// ─── MongoDB ObjectId ─────────────────────────────────────────────────────────

export type ObjectIdInfo = {
  hex: string;
  /** Seconds since the Unix epoch, from the leading four bytes. */
  unixSeconds: number;
  date: Date;
  /** Bytes 4-8 of the current spec: random per process, not a machine ID. */
  randomHex: string;
  /** The last three bytes, an incrementing counter. */
  counter: number;
  /** The same bytes read the way the pre-3.4 driver wrote them. */
  legacy: { machineHex: string; processId: number; counter: number };
};

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export function parseObjectId(value: string): ObjectIdInfo {
  const hex = value.trim().replace(/^ObjectId\(\s*["']?|["']?\s*\)$/g, '').toLowerCase();
  if (!OBJECT_ID.test(hex)) {
    throw new Error('An ObjectId is 24 hex characters');
  }

  const unixSeconds = parseInt(hex.slice(0, 8), 16);
  return {
    hex,
    unixSeconds,
    date: new Date(unixSeconds * 1000),
    randomHex: hex.slice(8, 18),
    counter: parseInt(hex.slice(18, 24), 16),
    legacy: {
      machineHex: hex.slice(8, 14),
      processId: parseInt(hex.slice(14, 18), 16),
      counter: parseInt(hex.slice(18, 24), 16),
    },
  };
}

export function formatObjectId(info: ObjectIdInfo): string {
  return [
    `ObjectId:     ${info.hex}`,
    '',
    `ISO 8601:     ${info.date.toISOString()}`,
    `UTC:          ${info.date.toUTCString()}`,
    `Unix sec:     ${info.unixSeconds}`,
    `Unix ms:      ${info.date.getTime()}`,
    '',
    `Random:       ${info.randomHex}  (5 bytes, per process)`,
    `Counter:      ${info.counter}`,
    '',
    'Read as a pre-3.4 ObjectId:',
    `  Machine:    ${info.legacy.machineHex}`,
    `  Process ID: ${info.legacy.processId}`,
    `  Counter:    ${info.legacy.counter}`,
  ].join('\n');
}

/**
 * The lowest ObjectId that could have been created at the given time: the
 * timestamp bytes followed by zeros, which is what a range query on `_id`
 * wants as its bound.
 */
export function objectIdForDate(input: string): string {
  const seconds = parseTimeInput(input);
  if (seconds < 0 || seconds > 0xffffffff) {
    throw new Error('An ObjectId can only hold times from 1970 to 2106');
  }
  return Math.floor(seconds).toString(16).padStart(8, '0') + '0'.repeat(16);
}

/** Accepts an ISO date, a Unix seconds value or a Unix milliseconds value. */
function parseTimeInput(input: string): number {
  const text = input.trim();
  if (!text) throw new Error('Enter a date or a Unix timestamp');

  if (/^-?\d+$/.test(text)) {
    const n = Number(text);
    // A bare number is seconds unless it is too big to be anything else.
    return Math.abs(n) > 1e11 ? n / 1000 : n;
  }

  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) throw new Error(`Cannot read "${text}" as a date`);
  return parsed / 1000;
}

// ─── Windows FILETIME ─────────────────────────────────────────────────────────

/** 100-nanosecond intervals between 1601-01-01 and the Unix epoch. */
export const FILETIME_EPOCH_OFFSET = 116444736000000000n;

export type FileTimeInfo = {
  ticks: bigint;
  unixMs: number;
  date: Date;
  hex: string;
  /** Set when the value predates 1970, which is legal but rarely intended. */
  beforeUnixEpoch: boolean;
};

/**
 * Reads a FILETIME as decimal, as `0x`-prefixed hex, or as the two 32-bit
 * halves Windows structures store it in (`dwHighDateTime dwLowDateTime`).
 */
export function parseFileTime(value: string): FileTimeInfo {
  // Thousands separators come off; a single space is left as the high/low split.
  const text = value.trim().replace(/[,_]/g, '').replace(/\s+/g, ' ');
  if (!text) throw new Error('Enter a FILETIME value');

  let ticks: bigint;
  const halves = text.match(/^(0x[0-9a-fA-F]+|\d+)\s+(0x[0-9a-fA-F]+|\d+)$/);

  try {
    if (halves) {
      const high = BigInt(halves[1]);
      const low = BigInt(halves[2]);
      if (high > 0xffffffffn || low > 0xffffffffn) {
        throw new Error('Each half of a FILETIME is a 32-bit value');
      }
      ticks = (high << 32n) | low;
    } else if (/^0x[0-9a-fA-F]+$/.test(text)) {
      ticks = BigInt(text);
    } else if (/^\d+$/.test(text)) {
      ticks = BigInt(text);
    } else if (/^[0-9a-fA-F]{16}$/.test(text)) {
      ticks = BigInt('0x' + text);
    } else {
      throw new Error('Not a FILETIME: expected a decimal or hex tick count');
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith('Each half')) throw e;
    if (e instanceof Error && e.message.startsWith('Not a FILETIME')) throw e;
    throw new Error('Not a FILETIME: expected a decimal or hex tick count');
  }

  if (ticks > 0xffffffffffffffffn) throw new Error('A FILETIME is a 64-bit value');

  const unixMs = Number((ticks - FILETIME_EPOCH_OFFSET) / 10000n);
  const date = new Date(unixMs);
  if (Number.isNaN(date.getTime())) throw new Error('That tick count is outside the range of a date');

  return {
    ticks,
    unixMs,
    date,
    hex: '0x' + ticks.toString(16).toUpperCase().padStart(16, '0'),
    beforeUnixEpoch: ticks < FILETIME_EPOCH_OFFSET,
  };
}

export function formatFileTime(info: FileTimeInfo): string {
  const lines = [
    `FILETIME:     ${info.ticks}`,
    `Hex:          ${info.hex}`,
    `High / Low:   ${info.ticks >> 32n} / ${info.ticks & 0xffffffffn}`,
    '',
    `ISO 8601:     ${info.date.toISOString()}`,
    `UTC:          ${info.date.toUTCString()}`,
    `Unix sec:     ${Math.floor(info.unixMs / 1000)}`,
    `Unix ms:      ${info.unixMs}`,
  ];
  if (info.ticks === 0n) lines.push('', 'Zero: an unset FILETIME, not a real time.');
  else if (info.beforeUnixEpoch) lines.push('', 'Before 1970. Valid, but usually a value read at the wrong offset.');
  return lines.join('\n');
}

/** The FILETIME for a date, an ISO string or a Unix timestamp. */
export function toFileTime(input: string): string {
  const seconds = parseTimeInput(input);
  const ticks = BigInt(Math.round(seconds * 1000)) * 10000n + FILETIME_EPOCH_OFFSET;
  if (ticks < 0n || ticks > 0xffffffffffffffffn) {
    throw new Error('That date is outside the range of a FILETIME');
  }
  return [
    `FILETIME:     ${ticks}`,
    `Hex:          0x${ticks.toString(16).toUpperCase().padStart(16, '0')}`,
    `High / Low:   ${ticks >> 32n} / ${ticks & 0xffffffffn}`,
  ].join('\n');
}
