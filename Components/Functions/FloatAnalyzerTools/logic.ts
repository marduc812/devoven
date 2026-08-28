export interface FloatPrecision {
  label: string;
  bits: number;
  exponentBits: number;
  mantissaBits: number;
  bias: number;
  sign: number; // 0 or 1
  exponentBinary: string;
  mantissaBinary: string;
  fullBinary: string;
  storedExponent: number;
  unbiasedExponent: number;
  exactValue: number;
  roundingError: number;
  isSpecial: boolean;
  specialName: string;
}

export interface FloatAnalysis {
  input: number;
  isNaN: boolean;
  isInfinity: boolean;
  isDenormal32: boolean;
  isDenormal64: boolean;
  single: FloatPrecision;
  double: FloatPrecision;
}

function toBitString(n: number, bits: number): string {
  let result = '';
  for (let i = bits - 1; i >= 0; i--) {
    result += (n >> i) & 1;
  }
  return result;
}

// Build IEEE 754 single precision (32-bit) bit representation using pure math
function analyzeSingle(value: number): FloatPrecision {
  const EXPONENT_BITS = 8;
  const MANTISSA_BITS = 23;
  const BIAS = 127;

  // Handle special cases
  if (isNaN(value)) {
    return {
      label: '32-bit Single Precision', bits: 32, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign: 0, exponentBinary: '11111111', mantissaBinary: '10000000000000000000000',
      fullBinary: '0 11111111 10000000000000000000000',
      storedExponent: 255, unbiasedExponent: 128, exactValue: NaN, roundingError: 0,
      isSpecial: true, specialName: 'NaN',
    };
  }
  if (!isFinite(value)) {
    const sign = value < 0 ? 1 : 0;
    return {
      label: '32-bit Single Precision', bits: 32, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign, exponentBinary: '11111111', mantissaBinary: '00000000000000000000000',
      fullBinary: `${sign} 11111111 00000000000000000000000`,
      storedExponent: 255, unbiasedExponent: 128, exactValue: Infinity, roundingError: 0,
      isSpecial: true, specialName: value < 0 ? '-Infinity' : '+Infinity',
    };
  }
  if (value === 0) {
    return {
      label: '32-bit Single Precision', bits: 32, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign: 0, exponentBinary: '00000000', mantissaBinary: '00000000000000000000000',
      fullBinary: '0 00000000 00000000000000000000000',
      storedExponent: 0, unbiasedExponent: -BIAS, exactValue: 0, roundingError: 0,
      isSpecial: false, specialName: '',
    };
  }

  const sign = value < 0 ? 1 : 0;
  const absVal = Math.abs(value);

  // Exponent
  let exp = Math.floor(Math.log2(absVal));
  // Clamp to single-precision range
  if (exp > 127) exp = 127;
  if (exp < -126) exp = -126;

  const storedExponent = exp + BIAS;
  const mantissaFraction = absVal / Math.pow(2, exp) - 1;

  // Build mantissa bits
  let mantissaBits = '';
  let remaining = mantissaFraction;
  for (let i = 0; i < MANTISSA_BITS; i++) {
    remaining *= 2;
    if (remaining >= 1) {
      mantissaBits += '1';
      remaining -= 1;
    } else {
      mantissaBits += '0';
    }
  }

  // Reconstruct exact stored value
  let reconstructedMantissa = 0;
  for (let i = 0; i < MANTISSA_BITS; i++) {
    if (mantissaBits[i] === '1') {
      reconstructedMantissa += Math.pow(2, -(i + 1));
    }
  }
  const exactValue = (sign ? -1 : 1) * Math.pow(2, exp) * (1 + reconstructedMantissa);
  const roundingError = exactValue - value;

  const exponentBinary = toBitString(storedExponent, EXPONENT_BITS);
  const fullBinary = `${sign} ${exponentBinary} ${mantissaBits}`;

  const isDenormal = storedExponent === 0;

  return {
    label: '32-bit Single Precision',
    bits: 32, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
    sign, exponentBinary, mantissaBinary: mantissaBits,
    fullBinary, storedExponent, unbiasedExponent: exp,
    exactValue, roundingError,
    isSpecial: isDenormal,
    specialName: isDenormal ? 'Denormal' : '',
  };
}

// Build IEEE 754 double precision (64-bit) bit representation using pure math
function analyzeDouble(value: number): FloatPrecision {
  const EXPONENT_BITS = 11;
  const MANTISSA_BITS = 52;
  const BIAS = 1023;

  if (isNaN(value)) {
    return {
      label: '64-bit Double Precision', bits: 64, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign: 0, exponentBinary: '11111111111', mantissaBinary: '1' + '0'.repeat(51),
      fullBinary: '0 11111111111 ' + '1' + '0'.repeat(51),
      storedExponent: 2047, unbiasedExponent: 1024, exactValue: NaN, roundingError: 0,
      isSpecial: true, specialName: 'NaN',
    };
  }
  if (!isFinite(value)) {
    const sign = value < 0 ? 1 : 0;
    return {
      label: '64-bit Double Precision', bits: 64, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign, exponentBinary: '11111111111', mantissaBinary: '0'.repeat(52),
      fullBinary: `${sign} 11111111111 ${'0'.repeat(52)}`,
      storedExponent: 2047, unbiasedExponent: 1024, exactValue: Infinity, roundingError: 0,
      isSpecial: true, specialName: value < 0 ? '-Infinity' : '+Infinity',
    };
  }
  if (value === 0) {
    return {
      label: '64-bit Double Precision', bits: 64, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
      sign: 0, exponentBinary: '0'.repeat(EXPONENT_BITS), mantissaBinary: '0'.repeat(MANTISSA_BITS),
      fullBinary: '0 ' + '0'.repeat(EXPONENT_BITS) + ' ' + '0'.repeat(MANTISSA_BITS),
      storedExponent: 0, unbiasedExponent: -BIAS, exactValue: 0, roundingError: 0,
      isSpecial: false, specialName: '',
    };
  }

  const sign = value < 0 ? 1 : 0;
  const absVal = Math.abs(value);

  let exp = Math.floor(Math.log2(absVal));
  if (exp > 1023) exp = 1023;
  if (exp < -1022) exp = -1022;

  const storedExponent = exp + BIAS;
  const mantissaFraction = absVal / Math.pow(2, exp) - 1;

  let mantissaBits = '';
  let remaining = mantissaFraction;
  for (let i = 0; i < MANTISSA_BITS; i++) {
    remaining *= 2;
    if (remaining >= 1) {
      mantissaBits += '1';
      remaining -= 1;
    } else {
      mantissaBits += '0';
    }
  }

  let reconstructedMantissa = 0;
  for (let i = 0; i < MANTISSA_BITS; i++) {
    if (mantissaBits[i] === '1') {
      reconstructedMantissa += Math.pow(2, -(i + 1));
    }
  }
  const exactValue = (sign ? -1 : 1) * Math.pow(2, exp) * (1 + reconstructedMantissa);
  const roundingError = exactValue - value;

  const exponentBinary = toBitString(storedExponent, EXPONENT_BITS);
  const fullBinary = `${sign} ${exponentBinary} ${mantissaBits}`;

  const isDenormal = storedExponent === 0;

  return {
    label: '64-bit Double Precision',
    bits: 64, exponentBits: EXPONENT_BITS, mantissaBits: MANTISSA_BITS, bias: BIAS,
    sign, exponentBinary, mantissaBinary: mantissaBits,
    fullBinary, storedExponent, unbiasedExponent: exp,
    exactValue, roundingError,
    isSpecial: isDenormal,
    specialName: isDenormal ? 'Denormal' : '',
  };
}

export function analyzeFloat(input: string): FloatAnalysis | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = parseFloat(trimmed);
  if (isNaN(value) && trimmed.toLowerCase() !== 'nan' && trimmed.toLowerCase() !== 'infinity' && trimmed.toLowerCase() !== '-infinity') {
    return null;
  }
  const parsed = trimmed.toLowerCase() === 'nan' ? NaN :
    trimmed.toLowerCase() === 'infinity' ? Infinity :
    trimmed.toLowerCase() === '-infinity' ? -Infinity : value;

  return {
    input: parsed,
    isNaN: isNaN(parsed),
    isInfinity: !isFinite(parsed) && !isNaN(parsed),
    isDenormal32: false,
    isDenormal64: false,
    single: analyzeSingle(parsed),
    double: analyzeDouble(parsed),
  };
}
