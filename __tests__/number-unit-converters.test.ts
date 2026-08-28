import {
  binaryToDecimal, decimalToBinary,
  romanToArabic, arabicToRoman,
  numberToWords,
  convertLength, getAllLengthConversions, LENGTH_UNITS,
  convertWeight, getAllWeightConversions, WEIGHT_UNITS,
  convertTemperature, getAllTemperatureConversions, TEMPERATURE_UNITS,
  convertSpeed, getAllSpeedConversions, SPEED_UNITS,
  convertArea, getAllAreaConversions, AREA_UNITS,
  convertVolume, getAllVolumeConversions, VOLUME_UNITS,
  convertDataSize, getAllDataSizeConversions, DATA_UNITS,
  convertAngle, getAllAngleConversions, ANGLE_UNITS,
  convertBitrate, getAllBitrateConversions, BITRATE_UNITS,
} from '../Components/Functions/NumberUnitConverters/logic';

// ─── Binary ↔ Decimal ─────────────────────────────────────────────────────────

describe('binaryToDecimal', () => {
  it('converts 0 to 0', () => expect(binaryToDecimal('0')).toBe('0'));
  it('converts 1 to 1', () => expect(binaryToDecimal('1')).toBe('1'));
  it('converts 1010 to 10', () => expect(binaryToDecimal('1010')).toBe('10'));
  it('converts 11111111 to 255', () => expect(binaryToDecimal('11111111')).toBe('255'));
  it('converts 100000000 to 256', () => expect(binaryToDecimal('100000000')).toBe('256'));
  it('returns empty string for empty input', () => expect(binaryToDecimal('')).toBe(''));
  it('returns empty string for whitespace', () => expect(binaryToDecimal('   ')).toBe(''));
  it('throws on non-binary characters', () => expect(() => binaryToDecimal('102')).toThrow('Invalid binary'));
  it('throws on letters', () => expect(() => binaryToDecimal('abc')).toThrow());
});

describe('decimalToBinary', () => {
  it('converts 0 to 0', () => expect(decimalToBinary('0')).toBe('0'));
  it('converts 1 to 1', () => expect(decimalToBinary('1')).toBe('1'));
  it('converts 10 to 1010', () => expect(decimalToBinary('10')).toBe('1010'));
  it('converts 255 to 11111111', () => expect(decimalToBinary('255')).toBe('11111111'));
  it('converts 256 to 100000000', () => expect(decimalToBinary('256')).toBe('100000000'));
  it('returns empty string for empty input', () => expect(decimalToBinary('')).toBe(''));
  it('throws on non-integer input', () => expect(() => decimalToBinary('abc')).toThrow());
  it('throws on negative numbers', () => expect(() => decimalToBinary('-5')).toThrow('Negative'));
  // Round-trips
  it('round-trips: 42', () => expect(binaryToDecimal(decimalToBinary('42'))).toBe('42'));
  it('round-trips: 1023', () => expect(binaryToDecimal(decimalToBinary('1023'))).toBe('1023'));
  it('round-trips: 65535', () => expect(binaryToDecimal(decimalToBinary('65535'))).toBe('65535'));
});

// ─── Roman Numerals ↔ Arabic ──────────────────────────────────────────────────

describe('romanToArabic', () => {
  it('converts I to 1', () => expect(romanToArabic('I')).toBe('1'));
  it('converts IV to 4', () => expect(romanToArabic('IV')).toBe('4'));
  it('converts IX to 9', () => expect(romanToArabic('IX')).toBe('9'));
  it('converts XIV to 14', () => expect(romanToArabic('XIV')).toBe('14'));
  it('converts XL to 40', () => expect(romanToArabic('XL')).toBe('40'));
  it('converts XC to 90', () => expect(romanToArabic('XC')).toBe('90'));
  it('converts CD to 400', () => expect(romanToArabic('CD')).toBe('400'));
  it('converts CM to 900', () => expect(romanToArabic('CM')).toBe('900'));
  it('converts MCMXCIX to 1999', () => expect(romanToArabic('MCMXCIX')).toBe('1999'));
  it('converts MMXXIV to 2024', () => expect(romanToArabic('MMXXIV')).toBe('2024'));
  it('converts MMMCMXCIX to 3999', () => expect(romanToArabic('MMMCMXCIX')).toBe('3999'));
  it('is case-insensitive', () => expect(romanToArabic('xiv')).toBe('14'));
  it('returns empty string for empty input', () => expect(romanToArabic('')).toBe(''));
  it('throws on invalid characters', () => expect(() => romanToArabic('ABC')).toThrow());
});

describe('arabicToRoman', () => {
  it('converts 1 to I', () => expect(arabicToRoman('1')).toBe('I'));
  it('converts 4 to IV', () => expect(arabicToRoman('4')).toBe('IV'));
  it('converts 9 to IX', () => expect(arabicToRoman('9')).toBe('IX'));
  it('converts 14 to XIV', () => expect(arabicToRoman('14')).toBe('XIV'));
  it('converts 40 to XL', () => expect(arabicToRoman('40')).toBe('XL'));
  it('converts 400 to CD', () => expect(arabicToRoman('400')).toBe('CD'));
  it('converts 900 to CM', () => expect(arabicToRoman('900')).toBe('CM'));
  it('converts 1999 to MCMXCIX', () => expect(arabicToRoman('1999')).toBe('MCMXCIX'));
  it('converts 2024 to MMXXIV', () => expect(arabicToRoman('2024')).toBe('MMXXIV'));
  it('converts 3999 to MMMCMXCIX', () => expect(arabicToRoman('3999')).toBe('MMMCMXCIX'));
  it('returns empty string for empty input', () => expect(arabicToRoman('')).toBe(''));
  it('throws on 0', () => expect(() => arabicToRoman('0')).toThrow('range'));
  it('throws on 4000', () => expect(() => arabicToRoman('4000')).toThrow('range'));
  it('throws on non-integer', () => expect(() => arabicToRoman('abc')).toThrow());
  // Round-trips
  it('round-trips: 1', () => expect(romanToArabic(arabicToRoman('1'))).toBe('1'));
  it('round-trips: 1999', () => expect(romanToArabic(arabicToRoman('1999'))).toBe('1999'));
  it('round-trips: 3999', () => expect(romanToArabic(arabicToRoman('3999'))).toBe('3999'));
});

// ─── Number to Words ──────────────────────────────────────────────────────────

describe('numberToWords', () => {
  it('converts 0', () => expect(numberToWords('0')).toBe('zero'));
  it('converts 1', () => expect(numberToWords('1')).toBe('one'));
  it('converts 13', () => expect(numberToWords('13')).toBe('thirteen'));
  it('converts 21', () => expect(numberToWords('21')).toBe('twenty-one'));
  it('converts 100', () => expect(numberToWords('100')).toBe('one hundred'));
  it('converts 101', () => expect(numberToWords('101')).toBe('one hundred one'));
  it('converts 999', () => expect(numberToWords('999')).toBe('nine hundred ninety-nine'));
  it('converts 1000', () => expect(numberToWords('1000')).toBe('one thousand'));
  it('converts 1001', () => expect(numberToWords('1001')).toBe('one thousand, one'));
  it('converts 1000000', () => expect(numberToWords('1000000')).toBe('one million'));
  it('converts 1000000000', () => expect(numberToWords('1000000000')).toBe('one billion'));
  it('converts 1000000000000', () => expect(numberToWords('1000000000000')).toBe('one trillion'));
  it('converts negative number', () => expect(numberToWords('-5')).toBe('negative five'));
  it('converts 42', () => expect(numberToWords('42')).toBe('forty-two'));
  it('converts 1234567', () => {
    const result = numberToWords('1234567');
    expect(result).toContain('million');
    expect(result).toContain('thousand');
  });
  it('returns empty string for empty input', () => expect(numberToWords('')).toBe(''));
  it('throws on non-integer', () => expect(() => numberToWords('1.5')).toThrow('integer'));
  it('throws on NaN', () => expect(() => numberToWords('abc')).toThrow());
});

// ─── Length ───────────────────────────────────────────────────────────────────

describe('convertLength', () => {
  it('1 km = 1000 m', () => expect(convertLength(1, 'km', 'm')).toBeCloseTo(1000));
  it('1 m = 100 cm', () => expect(convertLength(1, 'm', 'cm')).toBeCloseTo(100));
  it('1 mi ≈ 1609.344 m', () => expect(convertLength(1, 'mi', 'm')).toBeCloseTo(1609.344));
  it('1 ft = 12 in', () => expect(convertLength(1, 'ft', 'in')).toBeCloseTo(12));
  it('1 yd = 3 ft', () => expect(convertLength(1, 'yd', 'ft')).toBeCloseTo(3));
  it('same unit returns same value', () => expect(convertLength(5, 'km', 'km')).toBeCloseTo(5));
  // Round-trips
  it('round-trip: m → km → m', () => expect(convertLength(convertLength(5, 'm', 'km'), 'km', 'm')).toBeCloseTo(5));
  it('round-trip: mi → ft → mi', () => expect(convertLength(convertLength(3, 'mi', 'ft'), 'ft', 'mi')).toBeCloseTo(3));
  it('round-trip: cm → in → cm', () => expect(convertLength(convertLength(100, 'cm', 'in'), 'in', 'cm')).toBeCloseTo(100));
});

describe('getAllLengthConversions', () => {
  it('returns values for all units', () => {
    const result = getAllLengthConversions(1, 'km');
    for (const unit of LENGTH_UNITS) expect(result[unit]).toBeDefined();
  });
  it('from-unit value equals input', () => {
    expect(getAllLengthConversions(5, 'km').km).toBeCloseTo(5);
  });
});

// ─── Weight ───────────────────────────────────────────────────────────────────

describe('convertWeight', () => {
  it('1 kg = 1000 g', () => expect(convertWeight(1, 'kg', 'g')).toBeCloseTo(1000));
  it('1 kg ≈ 2.20462 lb', () => expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462, 3));
  it('1 lb = 16 oz', () => expect(convertWeight(1, 'lb', 'oz')).toBeCloseTo(16));
  it('1 t = 1000 kg', () => expect(convertWeight(1, 't', 'kg')).toBeCloseTo(1000));
  it('same unit returns same value', () => expect(convertWeight(7, 'kg', 'kg')).toBeCloseTo(7));
  // Round-trips
  it('round-trip: kg → lb → kg', () => expect(convertWeight(convertWeight(10, 'kg', 'lb'), 'lb', 'kg')).toBeCloseTo(10));
  it('round-trip: g → oz → g', () => expect(convertWeight(convertWeight(500, 'g', 'oz'), 'oz', 'g')).toBeCloseTo(500));
  it('round-trip: t → g → t', () => expect(convertWeight(convertWeight(2, 't', 'g'), 'g', 't')).toBeCloseTo(2));
});

describe('getAllWeightConversions', () => {
  it('returns values for all units', () => {
    const result = getAllWeightConversions(1, 'kg');
    for (const unit of WEIGHT_UNITS) expect(result[unit]).toBeDefined();
  });
  it('from-unit value equals input', () => {
    expect(getAllWeightConversions(3, 'lb').lb).toBeCloseTo(3);
  });
});

// ─── Temperature ──────────────────────────────────────────────────────────────

describe('convertTemperature', () => {
  it('0°C = 32°F', () => expect(convertTemperature(0, 'C', 'F')).toBeCloseTo(32));
  it('100°C = 212°F', () => expect(convertTemperature(100, 'C', 'F')).toBeCloseTo(212));
  it('0°C = 273.15 K', () => expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15));
  it('32°F = 0°C', () => expect(convertTemperature(32, 'F', 'C')).toBeCloseTo(0));
  it('212°F = 100°C', () => expect(convertTemperature(212, 'F', 'C')).toBeCloseTo(100));
  it('273.15 K = 0°C', () => expect(convertTemperature(273.15, 'K', 'C')).toBeCloseTo(0));
  it('same unit returns same value', () => expect(convertTemperature(25, 'C', 'C')).toBeCloseTo(25));
  // Round-trips
  it('round-trip: C → F → C', () => expect(convertTemperature(convertTemperature(37, 'C', 'F'), 'F', 'C')).toBeCloseTo(37));
  it('round-trip: C → K → C', () => expect(convertTemperature(convertTemperature(20, 'C', 'K'), 'K', 'C')).toBeCloseTo(20));
  it('round-trip: F → K → F', () => expect(convertTemperature(convertTemperature(98.6, 'F', 'K'), 'K', 'F')).toBeCloseTo(98.6));
});

describe('getAllTemperatureConversions', () => {
  it('returns values for all units', () => {
    const result = getAllTemperatureConversions(100, 'C');
    for (const unit of TEMPERATURE_UNITS) expect(result[unit]).toBeDefined();
  });
  it('0°C → F is 32', () => expect(getAllTemperatureConversions(0, 'C').F).toBeCloseTo(32));
});

// ─── Speed ────────────────────────────────────────────────────────────────────

describe('convertSpeed', () => {
  it('1 m/s = 3.6 km/h', () => expect(convertSpeed(1, 'ms', 'kmh')).toBeCloseTo(3.6));
  it('1 km/h ≈ 0.27778 m/s', () => expect(convertSpeed(1, 'kmh', 'ms')).toBeCloseTo(0.27778, 3));
  it('1 mph ≈ 1.60934 km/h', () => expect(convertSpeed(1, 'mph', 'kmh')).toBeCloseTo(1.60934, 3));
  it('1 knot ≈ 1.852 km/h', () => expect(convertSpeed(1, 'knots', 'kmh')).toBeCloseTo(1.852, 2));
  it('same unit returns same value', () => expect(convertSpeed(10, 'kmh', 'kmh')).toBeCloseTo(10));
  // Round-trips
  it('round-trip: ms → kmh → ms', () => expect(convertSpeed(convertSpeed(30, 'ms', 'kmh'), 'kmh', 'ms')).toBeCloseTo(30));
  it('round-trip: mph → knots → mph', () => expect(convertSpeed(convertSpeed(60, 'mph', 'knots'), 'knots', 'mph')).toBeCloseTo(60));
  it('round-trip: knots → ms → knots', () => expect(convertSpeed(convertSpeed(20, 'knots', 'ms'), 'ms', 'knots')).toBeCloseTo(20));
});

// ─── Area ─────────────────────────────────────────────────────────────────────

describe('convertArea', () => {
  it('1 km² = 1,000,000 m²', () => expect(convertArea(1, 'km2', 'm2')).toBeCloseTo(1_000_000));
  it('1 ha = 10,000 m²', () => expect(convertArea(1, 'ha', 'm2')).toBeCloseTo(10_000));
  it('1 acre ≈ 4046.856 m²', () => expect(convertArea(1, 'acre', 'm2')).toBeCloseTo(4046.856, 1));
  it('1 mi² ≈ 640 acres', () => expect(convertArea(1, 'mi2', 'acre')).toBeCloseTo(640, 0));
  it('same unit returns same value', () => expect(convertArea(5, 'ha', 'ha')).toBeCloseTo(5));
  // Round-trips
  it('round-trip: m2 → km2 → m2', () => expect(convertArea(convertArea(1_000_000, 'm2', 'km2'), 'km2', 'm2')).toBeCloseTo(1_000_000));
  it('round-trip: acre → ha → acre', () => expect(convertArea(convertArea(10, 'acre', 'ha'), 'ha', 'acre')).toBeCloseTo(10));
  it('round-trip: ft2 → m2 → ft2', () => expect(convertArea(convertArea(500, 'ft2', 'm2'), 'm2', 'ft2')).toBeCloseTo(500));
});

// ─── Volume ───────────────────────────────────────────────────────────────────

describe('convertVolume', () => {
  it('1 L = 1000 mL', () => expect(convertVolume(1, 'L', 'mL')).toBeCloseTo(1000));
  it('1 m³ = 1000 L', () => expect(convertVolume(1, 'm3', 'L')).toBeCloseTo(1000));
  it('1 gal ≈ 3.78541 L', () => expect(convertVolume(1, 'gal', 'L')).toBeCloseTo(3.78541, 3));
  it('1 gal = 4 qt', () => expect(convertVolume(1, 'gal', 'qt')).toBeCloseTo(4));
  it('1 qt = 2 pt', () => expect(convertVolume(1, 'qt', 'pt')).toBeCloseTo(2));
  it('same unit returns same value', () => expect(convertVolume(2, 'L', 'L')).toBeCloseTo(2));
  // Round-trips
  it('round-trip: L → mL → L', () => expect(convertVolume(convertVolume(5, 'L', 'mL'), 'mL', 'L')).toBeCloseTo(5));
  it('round-trip: gal → pt → gal', () => expect(convertVolume(convertVolume(3, 'gal', 'pt'), 'pt', 'gal')).toBeCloseTo(3));
  it('round-trip: m3 → floz → m3', () => expect(convertVolume(convertVolume(0.001, 'm3', 'floz'), 'floz', 'm3')).toBeCloseTo(0.001));
});

// ─── Data Size ────────────────────────────────────────────────────────────────

describe('convertDataSize', () => {
  it('1 KB = 1024 B', () => expect(convertDataSize(1, 'KB', 'B')).toBeCloseTo(1024));
  it('1 MB = 1024 KB', () => expect(convertDataSize(1, 'MB', 'KB')).toBeCloseTo(1024));
  it('1 GB = 1024 MB', () => expect(convertDataSize(1, 'GB', 'MB')).toBeCloseTo(1024));
  it('1 TB = 1024 GB', () => expect(convertDataSize(1, 'TB', 'GB')).toBeCloseTo(1024));
  it('1 PB = 1024 TB', () => expect(convertDataSize(1, 'PB', 'TB')).toBeCloseTo(1024));
  it('same unit returns same value', () => expect(convertDataSize(500, 'MB', 'MB')).toBeCloseTo(500));
  // Round-trips
  it('round-trip: B → MB → B', () => expect(convertDataSize(convertDataSize(1_048_576, 'B', 'MB'), 'MB', 'B')).toBeCloseTo(1_048_576));
  it('round-trip: GB → KB → GB', () => expect(convertDataSize(convertDataSize(2, 'GB', 'KB'), 'KB', 'GB')).toBeCloseTo(2));
  it('round-trip: PB → B → PB', () => expect(convertDataSize(convertDataSize(1, 'PB', 'B'), 'B', 'PB')).toBeCloseTo(1));
});

// ─── Angle ────────────────────────────────────────────────────────────────────

describe('convertAngle', () => {
  it('180 deg = π rad', () => expect(convertAngle(180, 'deg', 'rad')).toBeCloseTo(Math.PI));
  it('π rad = 180 deg', () => expect(convertAngle(Math.PI, 'rad', 'deg')).toBeCloseTo(180));
  it('360 deg = 400 grad', () => expect(convertAngle(360, 'deg', 'grad')).toBeCloseTo(400));
  it('400 grad = 360 deg', () => expect(convertAngle(400, 'grad', 'deg')).toBeCloseTo(360));
  it('π/2 rad = 100 grad', () => expect(convertAngle(Math.PI / 2, 'rad', 'grad')).toBeCloseTo(100));
  it('same unit returns same value', () => expect(convertAngle(90, 'deg', 'deg')).toBeCloseTo(90));
  // Round-trips
  it('round-trip: deg → rad → deg', () => expect(convertAngle(convertAngle(45, 'deg', 'rad'), 'rad', 'deg')).toBeCloseTo(45));
  it('round-trip: deg → grad → deg', () => expect(convertAngle(convertAngle(270, 'deg', 'grad'), 'grad', 'deg')).toBeCloseTo(270));
  it('round-trip: rad → grad → rad', () => expect(convertAngle(convertAngle(1, 'rad', 'grad'), 'grad', 'rad')).toBeCloseTo(1));
});

// ─── Bitrate ──────────────────────────────────────────────────────────────────

describe('convertBitrate', () => {
  it('1 kbps = 1000 bps', () => expect(convertBitrate(1, 'kbps', 'bps')).toBeCloseTo(1000));
  it('1 Mbps = 1000 kbps', () => expect(convertBitrate(1, 'Mbps', 'kbps')).toBeCloseTo(1000));
  it('1 Gbps = 1000 Mbps', () => expect(convertBitrate(1, 'Gbps', 'Mbps')).toBeCloseTo(1000));
  it('100 Mbps = 0.1 Gbps', () => expect(convertBitrate(100, 'Mbps', 'Gbps')).toBeCloseTo(0.1));
  it('same unit returns same value', () => expect(convertBitrate(25, 'Mbps', 'Mbps')).toBeCloseTo(25));
  // Round-trips
  it('round-trip: bps → Mbps → bps', () => expect(convertBitrate(convertBitrate(1_000_000, 'bps', 'Mbps'), 'Mbps', 'bps')).toBeCloseTo(1_000_000));
  it('round-trip: Gbps → kbps → Gbps', () => expect(convertBitrate(convertBitrate(5, 'Gbps', 'kbps'), 'kbps', 'Gbps')).toBeCloseTo(5));
  it('round-trip: kbps → bps → kbps', () => expect(convertBitrate(convertBitrate(512, 'kbps', 'bps'), 'bps', 'kbps')).toBeCloseTo(512));
});

describe('getAllSpeedConversions', () => {
  it('returns values for all units', () => {
    const result = getAllSpeedConversions(1, 'kmh');
    for (const unit of SPEED_UNITS) expect(result[unit]).toBeDefined();
  });
});

describe('getAllAreaConversions', () => {
  it('returns values for all units', () => {
    const result = getAllAreaConversions(1, 'm2');
    for (const unit of AREA_UNITS) expect(result[unit]).toBeDefined();
  });
});

describe('getAllVolumeConversions', () => {
  it('returns values for all units', () => {
    const result = getAllVolumeConversions(1, 'L');
    for (const unit of VOLUME_UNITS) expect(result[unit]).toBeDefined();
  });
});

describe('getAllDataSizeConversions', () => {
  it('returns values for all units', () => {
    const result = getAllDataSizeConversions(1, 'MB');
    for (const unit of DATA_UNITS) expect(result[unit]).toBeDefined();
  });
});

describe('getAllAngleConversions', () => {
  it('returns values for all units', () => {
    const result = getAllAngleConversions(1, 'deg');
    for (const unit of ANGLE_UNITS) expect(result[unit]).toBeDefined();
  });
});

describe('getAllBitrateConversions', () => {
  it('returns values for all units', () => {
    const result = getAllBitrateConversions(1, 'Mbps');
    for (const unit of BITRATE_UNITS) expect(result[unit]).toBeDefined();
  });
});
