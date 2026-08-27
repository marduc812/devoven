export type UuidTimestampInfo = {
  version: number;
  timestamp?: Date;
  formatted?: string;
  nodeId?: string; // v1 only
};

export function extractUuidTimestamp(uuidStr: string): UuidTimestampInfo {
  const s = uuidStr.trim().toLowerCase().replace(/[{}]/g, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-([0-9a-f]{12})$/;
  const match = s.match(uuidRegex);
  if (!match) throw new Error('Invalid UUID format');

  const version = parseInt(match[1], 16);

  if (version === 1) {
    // UUID v1: time_low-time_mid-version_time_hi-clock_seq-node
    const parts = s.split('-');
    const timeLow = parts[0];
    const timeMid = parts[1];
    const timeHiAndVersion = parts[2];
    const timeHi = timeHiAndVersion.slice(1); // remove version nibble

    // Combine: time_hi (12 bits) + time_mid (16 bits) + time_low (32 bits)
    const timeHex = timeHi + timeMid + timeLow;
    // This is a 60-bit count of 100ns intervals since Oct 15, 1582
    const ticks = BigInt('0x' + timeHex);
    // Convert to Unix ms: subtract offset and convert
    const gregorianOffset = BigInt('122192928000000000'); // 100ns intervals from 1582 to 1970
    const unixMs = Number((ticks - gregorianOffset) / BigInt(10000));
    const date = new Date(unixMs);

    return {
      version: 1,
      timestamp: date,
      formatted: date.toISOString(),
      nodeId: parts[4],
    };
  }

  if (version === 7) {
    // UUID v7: unix_ts_ms (48 bits) + version (4) + rand_a (12) + variant (2) + rand_b (62)
    const parts = s.split('-');
    const msHex = parts[0] + parts[1].slice(0, 4);
    const ms = parseInt(msHex, 16);
    const date = new Date(ms);

    return {
      version: 7,
      timestamp: date,
      formatted: date.toISOString(),
    };
  }

  return { version, formatted: `UUID v${version} does not contain a timestamp` };
}

export function formatUuidTimestamp(info: UuidTimestampInfo): string {
  if (!info.timestamp) return info.formatted ?? `No timestamp in UUID v${info.version}`;
  return [
    `Version:   ${info.version}`,
    `ISO 8601:  ${info.timestamp.toISOString()}`,
    `UTC:       ${info.timestamp.toUTCString()}`,
    `Unix ms:   ${info.timestamp.getTime()}`,
    `Unix sec:  ${Math.floor(info.timestamp.getTime() / 1000)}`,
    ...(info.nodeId ? [`Node ID:   ${info.nodeId}`] : []),
  ].join('\n');
}
