import {
  kelvinToMired,
  miredToKelvin,
  kelvinToRgb,
  rgbToHex,
  formatColorTemperature,
  describeTemperature,
  spectrumStops,
  isDarkRgb,
  KELVIN_MIN,
  KELVIN_MAX,
} from '@/Components/Functions/ColorTemperatureTools/logic';

describe('kelvinToMired', () => {
  it('converts 2000K to 500 µrd', () => expect(kelvinToMired(2000)).toBe(500));
  it('converts 5000K to 200 µrd', () => expect(kelvinToMired(5000)).toBe(200));
  it('converts 6500K to approx 154 µrd', () => expect(kelvinToMired(6500)).toBe(154));
});

describe('miredToKelvin', () => {
  it('converts 500 µrd to 2000K', () => expect(miredToKelvin(500)).toBe(2000));
  it('converts 200 µrd to 5000K', () => expect(miredToKelvin(200)).toBe(5000));
  it('converts 154 µrd to approx 6494K', () => expect(miredToKelvin(154)).toBe(6494));
});

describe('kelvinToRgb', () => {
  it('returns r=255 for low temperatures (warm)', () => {
    const rgb = kelvinToRgb(2000);
    expect(rgb.r).toBe(255);
  });
  it('returns b=255 for high temperatures (cool)', () => {
    const rgb = kelvinToRgb(7000);
    expect(rgb.b).toBe(255);
  });
  it('returns RGB components in valid range 0-255', () => {
    const tests = [1000, 3000, 5000, 6600, 10000];
    for (const k of tests) {
      const rgb = kelvinToRgb(k);
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    }
  });
  it('6600K returns approximately white (all channels high)', () => {
    const rgb = kelvinToRgb(6600);
    expect(rgb.r).toBeGreaterThan(200);
    expect(rgb.g).toBeGreaterThan(200);
    expect(rgb.b).toBeGreaterThan(200);
  });
});

describe('rgbToHex', () => {
  it('converts white to #FFFFFF', () => expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF'));
  it('converts black to #000000', () => expect(rgbToHex(0, 0, 0)).toBe('#000000'));
  it('converts red to #FF0000', () => expect(rgbToHex(255, 0, 0)).toBe('#FF0000'));
  it('pads single digit hex values', () => expect(rgbToHex(1, 2, 3)).toBe('#010203'));
});

describe('formatColorTemperature', () => {
  it('includes Kelvin in output', () => {
    const result = formatColorTemperature(5500);
    expect(result).toContain('5500K');
  });
  it('includes Mired in output', () => {
    const result = formatColorTemperature(5000);
    expect(result).toContain('µrd');
  });
  it('includes RGB in output', () => {
    const result = formatColorTemperature(3000);
    expect(result).toContain('rgb(');
  });
  it('includes hex in output', () => {
    const result = formatColorTemperature(3000);
    expect(result).toContain('#');
  });
  it('labels warm colors correctly', () => {
    const result = formatColorTemperature(2500);
    expect(result).toContain('Warm');
  });
  it('labels daylight correctly', () => {
    const result = formatColorTemperature(6000);
    expect(result).toContain('Daylight');
  });
});

describe('describeTemperature', () => {
  it('labels candlelight', () => expect(describeTemperature(1900)).toBe('Warm/Candlelight'));
  it('labels tungsten as warm white', () => expect(describeTemperature(2800)).toBe('Warm White'));
  it('labels 5500K as daylight', () => expect(describeTemperature(5500)).toBe('Daylight'));
  it('labels 10000K as cold', () => expect(describeTemperature(10000)).toBe('Blue Sky / Cold'));
  it('agrees with the text output', () => {
    expect(formatColorTemperature(3500)).toContain(describeTemperature(3500));
  });
});

describe('spectrumStops', () => {
  it('spans the documented Kelvin range', () => {
    const stops = spectrumStops(10);
    expect(stops[0].kelvin).toBe(KELVIN_MIN);
    expect(stops[stops.length - 1].kelvin).toBe(KELVIN_MAX);
  });
  it('returns one more stop than steps', () => expect(spectrumStops(8)).toHaveLength(9));
  it('offsets run 0 to 100', () => {
    const stops = spectrumStops(4);
    expect(stops[0].offset).toBe(0);
    expect(stops[stops.length - 1].offset).toBe(100);
  });
  it('every stop carries a 6 digit hex', () => {
    for (const s of spectrumStops(12)) expect(s.hex).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('warm end is redder than the cool end', () => {
    const stops = spectrumStops(4);
    expect(kelvinToRgb(stops[0].kelvin).b).toBeLessThan(kelvinToRgb(stops[4].kelvin).b);
  });
});

describe('isDarkRgb', () => {
  it('black is dark', () => expect(isDarkRgb(0, 0, 0)).toBe(true));
  it('white is not dark', () => expect(isDarkRgb(255, 255, 255)).toBe(false));
  it('candlelight is dark enough for light text', () => {
    const rgb = kelvinToRgb(1000);
    expect(isDarkRgb(rgb.r, rgb.g, rgb.b)).toBe(true);
  });
});
