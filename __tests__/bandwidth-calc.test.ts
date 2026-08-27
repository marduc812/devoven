import {
  fileSizeToBytes,
  bandwidthToBitsPerSecond,
  calculateTransferTime,
  calculateCommonSpeeds,
  parseBandwidthInput,
  formatBandwidthResult,
} from '@/Components/Functions/BandwidthCalcTools/logic';

describe('fileSizeToBytes', () => {
  it('converts KB', () => expect(fileSizeToBytes(1, 'KB')).toBe(1000));
  it('converts MB', () => expect(fileSizeToBytes(1, 'MB')).toBe(1000000));
  it('converts GB', () => expect(fileSizeToBytes(1, 'GB')).toBe(1000000000));
  it('converts TB', () => expect(fileSizeToBytes(1, 'TB')).toBe(1000000000000));
});

describe('bandwidthToBitsPerSecond', () => {
  it('converts Kbps', () => expect(bandwidthToBitsPerSecond(1, 'Kbps')).toBe(1000));
  it('converts Mbps', () => expect(bandwidthToBitsPerSecond(1, 'Mbps')).toBe(1000000));
  it('converts Gbps', () => expect(bandwidthToBitsPerSecond(1, 'Gbps')).toBe(1000000000));
});

describe('calculateTransferTime', () => {
  it('calculates transfer time for 1 MB at 1 Mbps (8 seconds)', () => {
    const result = calculateTransferTime(1, 'MB', 1, 'Mbps');
    // 1 MB = 8 Mbits, 8 Mbits / 1 Mbps = 8 seconds
    expect(result.seconds).toBeCloseTo(8, 5);
  });

  it('calculates for 1 GB at 1 Gbps (8 seconds)', () => {
    const result = calculateTransferTime(1, 'GB', 1, 'Gbps');
    expect(result.seconds).toBeCloseTo(8, 5);
  });

  it('throws on zero file size', () => {
    expect(() => calculateTransferTime(0, 'MB', 10, 'Mbps')).toThrow();
  });

  it('throws on zero bandwidth', () => {
    expect(() => calculateTransferTime(100, 'MB', 0, 'Mbps')).toThrow();
  });

  it('returns hours for large files', () => {
    const result = calculateTransferTime(100, 'GB', 1, 'Mbps');
    expect(result.hours).toBeGreaterThan(1);
  });
});

describe('calculateCommonSpeeds', () => {
  it('returns 6 speed rows', () => {
    const rows = calculateCommonSpeeds(700, 'MB');
    expect(rows.length).toBe(6);
  });

  it('faster speeds yield shorter times', () => {
    const rows = calculateCommonSpeeds(1, 'GB');
    expect(rows[0].result.seconds).toBeGreaterThan(rows[1].result.seconds);
  });
});

describe('parseBandwidthInput', () => {
  it('parses valid input', () => {
    const result = parseBandwidthInput('700 MB\n10 Mbps');
    expect(result.fileSizeValue).toBe(700);
    expect(result.fileSizeUnit).toBe('MB');
    expect(result.bandwidthValue).toBe(10);
    expect(result.bandwidthUnit).toBe('Mbps');
  });

  it('throws for missing bandwidth line', () => {
    expect(() => parseBandwidthInput('700 MB')).toThrow();
  });

  it('throws for bad file size format', () => {
    expect(() => parseBandwidthInput('700 XB\n10 Mbps')).toThrow();
  });
});

describe('formatBandwidthResult', () => {
  it('includes transfer time and common speeds', () => {
    const output = formatBandwidthResult(700, 'MB', 10, 'Mbps');
    expect(output).toContain('Transfer Time');
    expect(output).toContain('Common Speed Reference');
  });
});
