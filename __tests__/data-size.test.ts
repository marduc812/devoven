import {
  convertDataSize,
  getAllDataSizeConversions,
  DATA_UNITS,
} from '@/Components/Functions/NumberUnitConverters/logic';

describe('convertDataSize', () => {
  it('converts bytes to kilobytes', () => {
    expect(convertDataSize(1024, 'B', 'KB')).toBeCloseTo(1, 10);
  });

  it('converts kilobytes to megabytes', () => {
    expect(convertDataSize(1024, 'KB', 'MB')).toBeCloseTo(1, 10);
  });

  it('converts gigabytes to bytes', () => {
    expect(convertDataSize(1, 'GB', 'B')).toBeCloseTo(1024 ** 3, 0);
  });

  it('converts terabytes to gigabytes', () => {
    expect(convertDataSize(1, 'TB', 'GB')).toBeCloseTo(1024, 10);
  });

  it('identity conversion returns same value', () => {
    expect(convertDataSize(42, 'MB', 'MB')).toBeCloseTo(42, 10);
  });

  it('converts petabytes to terabytes', () => {
    expect(convertDataSize(1, 'PB', 'TB')).toBeCloseTo(1024, 10);
  });

  it('handles zero value', () => {
    expect(convertDataSize(0, 'GB', 'MB')).toBe(0);
  });

  it('handles fractional input', () => {
    expect(convertDataSize(0.5, 'GB', 'MB')).toBeCloseTo(512, 5);
  });
});

describe('getAllDataSizeConversions', () => {
  it('returns all units', () => {
    const result = getAllDataSizeConversions(1, 'GB');
    for (const unit of DATA_UNITS) {
      expect(result).toHaveProperty(unit);
    }
  });

  it('GB to itself is 1', () => {
    const result = getAllDataSizeConversions(1, 'GB');
    expect(result['GB']).toBeCloseTo(1, 10);
  });

  it('1 KB in bytes is 1024', () => {
    const result = getAllDataSizeConversions(1, 'KB');
    expect(result['B']).toBeCloseTo(1024, 5);
  });

  it('1024 MB in GB is 1', () => {
    const result = getAllDataSizeConversions(1024, 'MB');
    expect(result['GB']).toBeCloseTo(1, 10);
  });

  it('returns numbers for all units', () => {
    const result = getAllDataSizeConversions(100, 'MB');
    DATA_UNITS.forEach(unit => {
      expect(typeof result[unit]).toBe('number');
    });
  });
});
