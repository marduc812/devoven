import {
  kelvinToRgb,
  rgbToHex,
  getDescriptor,
  getSceneDescription,
  getNearestPreset,
  getCssFilter,
  convertWhiteBalance,
  WB_PRESETS,
} from '@/Components/Functions/WhiteBalanceTools/logic';

describe('kelvinToRgb', () => {
  it('5500K is roughly daylight white', () => {
    const { r, g, b } = kelvinToRgb(5500);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(200);
  });

  it('2700K is warm (more red than blue)', () => {
    const { r, b } = kelvinToRgb(2700);
    expect(r).toBeGreaterThan(b);
  });

  it('10000K is cool (more blue)', () => {
    const { r, b } = kelvinToRgb(10000);
    expect(b).toBeGreaterThanOrEqual(r);
  });

  it('returns values in 0-255 range', () => {
    for (const k of [1000, 3000, 5500, 8000, 12000]) {
      const { r, g, b } = kelvinToRgb(k);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});

describe('rgbToHex', () => {
  it('converts red to FF0000', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });
});

describe('getDescriptor', () => {
  it('returns warm descriptor for low kelvin', () => {
    expect(getDescriptor(2000).toLowerCase()).toContain('warm');
  });

  it('returns cool descriptor for high kelvin', () => {
    expect(getDescriptor(9000).toLowerCase()).toContain('cool');
  });

  it('returns daylight descriptor for ~5500K', () => {
    expect(getDescriptor(5500).toLowerCase()).toContain('daylight');
  });
});

describe('getNearestPreset', () => {
  it('finds tungsten for 3200K', () => {
    const preset = getNearestPreset(3200);
    expect(preset.name).toContain('Tungsten');
  });

  it('finds daylight for 5500K', () => {
    const preset = getNearestPreset(5500);
    expect(preset.name).toContain('Daylight');
  });
});

describe('getCssFilter', () => {
  it('returns none for daylight temperatures', () => {
    const filter = getCssFilter(5500);
    expect(filter).toContain('none');
  });

  it('returns sepia for warm temperatures', () => {
    const filter = getCssFilter(2500);
    expect(filter).toContain('sepia');
  });

  it('returns hue-rotate for cool temperatures', () => {
    const filter = getCssFilter(8000);
    expect(filter).toContain('hue-rotate');
  });
});

describe('convertWhiteBalance', () => {
  it('returns empty for empty input', () => {
    expect(convertWhiteBalance('')).toBe('');
  });

  it('returns error for invalid input', () => {
    expect(convertWhiteBalance('abc')).toContain('Enter a Kelvin');
  });

  it('returns error for out of range', () => {
    expect(convertWhiteBalance('50000')).toContain('out of range');
  });

  it('shows RGB and hex for valid input', () => {
    const result = convertWhiteBalance('5500');
    expect(result).toContain('Approx RGB');
    expect(result).toContain('Approx Hex');
  });

  it('shows nearest preset', () => {
    const result = convertWhiteBalance('5500');
    expect(result).toContain('Nearest Camera Preset');
  });

  it('shows CSS filter', () => {
    const result = convertWhiteBalance('5500');
    expect(result).toContain('CSS Filter');
  });

  it('handles K suffix', () => {
    const result = convertWhiteBalance('5500K');
    expect(result).toContain('5500');
  });
});

describe('WB_PRESETS', () => {
  it('has at least 6 presets', () => {
    expect(WB_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('all presets have kelvin values', () => {
    for (const p of WB_PRESETS) {
      expect(p.kelvin).toBeGreaterThan(0);
    }
  });
});
