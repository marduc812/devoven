// NTP epoch is January 1, 1900
// Unix epoch is January 1, 1970
// Difference: 70 years in seconds
// 70 years = 17 leap years (1904,1908,...1968) + 53 normal years
// = 17*366 + 53*365 = 6218 + 19345 = 25567 days
// = 25567 * 86400 = 2208988800 seconds
export const NTP_UNIX_OFFSET = 2208988800;

export interface NtpResult {
  ntpTimestamp: number;       // NTP seconds (since 1900)
  unixTimestamp: number;      // Unix seconds (since 1970)
  utcString: string;          // Human-readable UTC
  ntpShort: string;           // 32-bit NTP (hex)
  ntpLong: string;            // 64-bit NTP representation (hex)
  epochDiff: number;          // Always NTP_UNIX_OFFSET
  era: number;                // NTP era (0 = 1900-2036)
  isNtp: boolean;             // true = input was NTP, false = input was Unix
}

export function parseNtpInput(input: string): { value: number; isNtp: boolean } {
  const trimmed = input.trim();
  const n = parseFloat(trimmed);
  if (isNaN(n) || n < 0) throw new Error('Enter a non-negative numeric timestamp');

  // Heuristic: NTP timestamps for modern dates are > 3,600,000,000
  // Unix timestamps for modern dates are ~ 1,700,000,000
  // If the value is >= NTP_UNIX_OFFSET, treat as NTP; otherwise Unix
  if (n >= NTP_UNIX_OFFSET) {
    return { value: n, isNtp: true };
  } else {
    return { value: n, isNtp: false };
  }
}

function toHex32(n: number): string {
  // Clamp to 32-bit unsigned
  const clamped = Math.floor(n) >>> 0;
  return '0x' + clamped.toString(16).padStart(8, '0').toUpperCase();
}

function toHex64(ntpSec: number): string {
  // NTP 64-bit = 32-bit seconds | 32-bit fraction (we use 0 fraction)
  const sec = Math.floor(ntpSec) >>> 0;
  const secHex = sec.toString(16).padStart(8, '0').toUpperCase();
  return '0x' + secHex + '00000000';
}

export function convertNtp(input: string): NtpResult {
  const { value, isNtp } = parseNtpInput(input);

  let ntpTimestamp: number;
  let unixTimestamp: number;

  if (isNtp) {
    ntpTimestamp = Math.floor(value);
    unixTimestamp = ntpTimestamp - NTP_UNIX_OFFSET;
  } else {
    unixTimestamp = Math.floor(value);
    ntpTimestamp = unixTimestamp + NTP_UNIX_OFFSET;
  }

  const date = new Date(unixTimestamp * 1000);
  const utcString = date.toUTCString();

  // NTP era: each era is 2^32 seconds (~136 years). Era 0 = 1900-2036.
  const era = Math.floor(ntpTimestamp / 4294967296);

  return {
    ntpTimestamp,
    unixTimestamp,
    utcString,
    ntpShort: toHex32(ntpTimestamp),
    ntpLong: toHex64(ntpTimestamp),
    epochDiff: NTP_UNIX_OFFSET,
    era,
    isNtp,
  };
}

export function formatNtpResult(result: NtpResult): string {
  const lines: string[] = [
    `=== NTP Time Conversion ===`,
    ``,
    `NTP Timestamp:     ${result.ntpTimestamp} seconds`,
    `Unix Timestamp:    ${result.unixTimestamp} seconds`,
    `UTC Date/Time:     ${result.utcString}`,
    ``,
    `=== NTP Formats ===`,
    `Short (32-bit):    ${result.ntpShort}`,
    `Long  (64-bit):    ${result.ntpLong}`,
    ``,
    `=== Epoch Info ===`,
    `NTP Era:           ${result.era} (Era 0 = 1900-01-01 to 2036-02-07)`,
    `NTP Epoch:         1900-01-01 00:00:00 UTC`,
    `Unix Epoch:        1970-01-01 00:00:00 UTC`,
    `Difference:        ${result.epochDiff} seconds (70 years, 17 leap days)`,
    ``,
    `Input detected as: ${result.isNtp ? 'NTP timestamp' : 'Unix timestamp'}`,
  ];
  return lines.join('\n');
}
