import {
  windChillF, heatIndexF, dewPointC,
  parseWeatherInput, computeWeather,
} from '@/Components/Functions/WeatherCalcTools/logic';

describe('windChillF', () => {
  it('returns null above 50°F', () => {
    expect(windChillF(55, 10)).toBeNull();
  });
  it('returns null below 3 mph', () => {
    expect(windChillF(30, 2)).toBeNull();
  });
  it('computes wind chill at 30°F and 20mph', () => {
    const wc = windChillF(30, 20);
    expect(wc).not.toBeNull();
    expect(wc!).toBeLessThan(30);
  });
  it('wind chill < actual temp', () => {
    const wc = windChillF(20, 15);
    expect(wc!).toBeLessThan(20);
  });
});

describe('heatIndexF', () => {
  it('returns null below 80°F', () => {
    expect(heatIndexF(75, 60)).toBeNull();
  });
  it('returns null below 40% RH', () => {
    expect(heatIndexF(90, 35)).toBeNull();
  });
  it('computes heat index at 95°F and 60% RH', () => {
    const hi = heatIndexF(95, 60);
    expect(hi).not.toBeNull();
    expect(hi!).toBeGreaterThan(95);
  });
});

describe('dewPointC', () => {
  it('dew point equals temp at 100% RH', () => {
    expect(dewPointC(20, 100)).toBeCloseTo(20, 0);
  });
  it('dew point is below temp for RH < 100%', () => {
    expect(dewPointC(20, 60)).toBeLessThan(20);
  });
  it('returns a number', () => {
    expect(typeof dewPointC(25, 70)).toBe('number');
  });
});

describe('parseWeatherInput', () => {
  it('parses temperature in Celsius', () => {
    const r = parseWeatherInput('T=20°C\nRH=65%');
    expect(r.tempC).toBeCloseTo(20);
    expect(r.rhPct).toBeCloseTo(65);
  });
  it('parses temperature in Fahrenheit', () => {
    const r = parseWeatherInput('T=72°F');
    expect(r.tempF).toBeCloseTo(72);
  });
  it('parses wind in km/h', () => {
    const r = parseWeatherInput('W=30km/h');
    expect(r.windKmh).toBeCloseTo(30);
  });
  it('parses wind in mph', () => {
    const r = parseWeatherInput('W=20mph');
    expect(r.windMph).toBeCloseTo(20);
  });
  it('parses wind in m/s', () => {
    const r = parseWeatherInput('W=5m/s');
    expect(r.windMs).toBeCloseTo(5);
  });
});

describe('computeWeather', () => {
  it('throws when no temperature provided', () => {
    expect(() => computeWeather({ tempC: null, tempF: null, windKmh: 10, windMph: null, windMs: null, rhPct: 60 })).toThrow();
  });
  it('returns both Celsius and Fahrenheit', () => {
    const r = computeWeather({ tempC: 0, tempF: null, windKmh: 0, windMph: null, windMs: null, rhPct: null });
    expect(r.tempF).toBeCloseTo(32);
  });
  it('computes wind chill when conditions met', () => {
    // T=-10°C = 14°F, wind = 30 km/h ≈ 18.6 mph
    const r = computeWeather({ tempC: -10, tempF: null, windKmh: 30, windMph: null, windMs: null, rhPct: null });
    expect(r.windChill).not.toBeNull();
    expect(r.windChill!).toBeLessThan(-10);
  });
  it('computes dew point when RH provided', () => {
    const r = computeWeather({ tempC: 25, tempF: null, windKmh: 0, windMph: null, windMs: null, rhPct: 60 });
    expect(r.dewPoint).not.toBeNull();
    expect(r.dewPoint!).toBeLessThan(25);
  });
});
