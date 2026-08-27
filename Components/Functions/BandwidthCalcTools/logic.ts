export type FileSizeUnit = 'KB' | 'MB' | 'GB' | 'TB';
export type BandwidthUnit = 'Kbps' | 'Mbps' | 'Gbps';

export interface TransferTimeResult {
  seconds: number;
  minutes: number;
  hours: number;
  formatted: string;
}

export interface CommonSpeedRow {
  label: string;
  mbps: number;
  result: TransferTimeResult;
}

export function fileSizeToBytes(value: number, unit: FileSizeUnit): number {
  switch (unit) {
    case 'KB': return value * 1000;
    case 'MB': return value * 1000 * 1000;
    case 'GB': return value * 1000 * 1000 * 1000;
    case 'TB': return value * 1000 * 1000 * 1000 * 1000;
  }
}

export function bandwidthToBitsPerSecond(value: number, unit: BandwidthUnit): number {
  switch (unit) {
    case 'Kbps': return value * 1000;
    case 'Mbps': return value * 1000 * 1000;
    case 'Gbps': return value * 1000 * 1000 * 1000;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)} ms`;
  }
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  }
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toFixed(0)}s`;
  }
  const h = Math.floor(seconds / 3600);
  const rem = seconds % 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${h}h ${m}m ${s.toFixed(0)}s`;
}

export function calculateTransferTime(
  fileSizeValue: number,
  fileSizeUnit: FileSizeUnit,
  bandwidthValue: number,
  bandwidthUnit: BandwidthUnit,
): TransferTimeResult {
  if (fileSizeValue <= 0) throw new Error('File size must be positive');
  if (bandwidthValue <= 0) throw new Error('Bandwidth must be positive');

  const bytes = fileSizeToBytes(fileSizeValue, fileSizeUnit);
  const bitsPerSec = bandwidthToBitsPerSecond(bandwidthValue, bandwidthUnit);
  const bits = bytes * 8;
  const seconds = bits / bitsPerSec;
  const minutes = seconds / 60;
  const hours = seconds / 3600;

  return {
    seconds,
    minutes,
    hours,
    formatted: formatDuration(seconds),
  };
}

const COMMON_SPEEDS: Array<{ label: string; mbps: number }> = [
  { label: '1 Mbps (slow broadband)', mbps: 1 },
  { label: '10 Mbps (home broadband)', mbps: 10 },
  { label: '100 Mbps (fast broadband)', mbps: 100 },
  { label: '1 Gbps (gigabit)', mbps: 1000 },
  { label: '5G (up to 1 Gbps)', mbps: 1000 },
  { label: 'Fiber (up to 10 Gbps)', mbps: 10000 },
];

export function calculateCommonSpeeds(
  fileSizeValue: number,
  fileSizeUnit: FileSizeUnit,
): CommonSpeedRow[] {
  return COMMON_SPEEDS.map(speed => ({
    label: speed.label,
    mbps: speed.mbps,
    result: calculateTransferTime(fileSizeValue, fileSizeUnit, speed.mbps, 'Mbps'),
  }));
}

export function formatBandwidthResult(
  fileSizeValue: number,
  fileSizeUnit: FileSizeUnit,
  bandwidthValue: number,
  bandwidthUnit: BandwidthUnit,
): string {
  const result = calculateTransferTime(fileSizeValue, fileSizeUnit, bandwidthValue, bandwidthUnit);
  const common = calculateCommonSpeeds(fileSizeValue, fileSizeUnit);

  const lines: string[] = [
    '=== Transfer Time ===',
    `File Size:    ${fileSizeValue} ${fileSizeUnit}`,
    `Bandwidth:    ${bandwidthValue} ${bandwidthUnit}`,
    `Time:         ${result.formatted}`,
    `              (${result.seconds.toFixed(3)} seconds)`,
    '',
    '=== Common Speed Reference ===',
  ];

  for (const row of common) {
    const label = row.label.padEnd(30);
    lines.push(`${label}  ${row.result.formatted}`);
  }

  return lines.join('\n');
}

export function parseBandwidthInput(input: string): {
  fileSizeValue: number;
  fileSizeUnit: FileSizeUnit;
  bandwidthValue: number;
  bandwidthUnit: BandwidthUnit;
} {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) {
    throw new Error('Enter file size (e.g. "700 MB") and bandwidth (e.g. "10 Mbps") — one per line');
  }

  const fileSizeMatch = lines[0].match(/^([\d.]+)\s*(KB|MB|GB|TB)$/i);
  const bandwidthMatch = lines[1].match(/^([\d.]+)\s*(Kbps|Mbps|Gbps)$/i);

  if (!fileSizeMatch) throw new Error('Invalid file size. Use format: "700 MB" (KB, MB, GB, TB)');
  if (!bandwidthMatch) throw new Error('Invalid bandwidth. Use format: "10 Mbps" (Kbps, Mbps, Gbps)');

  return {
    fileSizeValue: parseFloat(fileSizeMatch[1]),
    fileSizeUnit: fileSizeMatch[2].toUpperCase() as FileSizeUnit,
    bandwidthValue: parseFloat(bandwidthMatch[1]),
    bandwidthUnit: bandwidthMatch[2] as BandwidthUnit,
  };
}
