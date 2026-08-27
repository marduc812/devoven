// Colorblind Simulator — pure TypeScript, no browser APIs
// Simulates how colors appear to people with different types of color blindness
// Uses standard simulation matrices from Machado et al. 2009

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ColorblindType = 'Protanopia' | 'Deuteranopia' | 'Tritanopia' | 'Achromatopsia';

export interface ColorblindResult {
  type: ColorblindType;
  description: string;
  originalHex: string;
  simulatedHex: string;
  simulatedRgb: RGB;
  affectedPopulation: string;
}

// Simulation matrices (linearRGB space) from Machado et al.
// Applied to linear RGB values
const MATRICES: Record<ColorblindType, number[][]> = {
  Protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  Deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  Tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
  Achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
};

const DESCRIPTIONS: Record<ColorblindType, string> = {
  Protanopia: 'Red-blind: Cannot perceive red light. Reds appear dark/black, confusion between red-green.',
  Deuteranopia: 'Green-blind: Cannot perceive green light. Most common form (~1% of males).',
  Tritanopia: 'Blue-blind: Cannot perceive blue light. Rare, affecting ~0.003% of population.',
  Achromatopsia: 'Complete color blindness: Sees only in shades of gray. Extremely rare.',
};

const POPULATIONS: Record<ColorblindType, string> = {
  Protanopia: '~1% of males, ~0.01% of females',
  Deuteranopia: '~1% of males, ~0.01% of females',
  Tritanopia: '~0.003% of population',
  Achromatopsia: '~0.003% of population',
};

export function parseHex(hex: string): RGB {
  const clean = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(clean)) {
    throw new Error('Invalid hex color: ' + hex);
  }
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb.r))).toString(16).padStart(2, '0');
  const g = Math.max(0, Math.min(255, Math.round(rgb.g))).toString(16).padStart(2, '0');
  const b = Math.max(0, Math.min(255, Math.round(rgb.b))).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}

// Convert sRGB [0-255] to linear RGB
function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

// Convert linear RGB to sRGB [0-255]
function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const out = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(out * 255);
}

function applyMatrix(rgb: RGB, matrix: number[][]): RGB {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const rOut = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
  const gOut = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
  const bOut = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

  return {
    r: linearToSrgb(rOut),
    g: linearToSrgb(gOut),
    b: linearToSrgb(bOut),
  };
}

export function simulateColorblindness(hex: string, type: ColorblindType): ColorblindResult {
  const original = parseHex(hex);
  const matrix = MATRICES[type];
  const simulated = applyMatrix(original, matrix);
  const simulatedHex = rgbToHex(simulated);

  return {
    type,
    description: DESCRIPTIONS[type],
    originalHex: rgbToHex(original),
    simulatedHex,
    simulatedRgb: simulated,
    affectedPopulation: POPULATIONS[type],
  };
}

export function simulateAll(hex: string): ColorblindResult[] {
  const types: ColorblindType[] = ['Protanopia', 'Deuteranopia', 'Tritanopia', 'Achromatopsia'];
  return types.map(type => simulateColorblindness(hex, type));
}

export function formatSimulationResults(hex: string): string {
  try {
    const original = parseHex(hex);
    const originalHex = rgbToHex(original);
    const results = simulateAll(hex);

    const lines: string[] = [
      '=== Colorblind Simulation ===',
      '',
      'Original Color: ' + originalHex + ' (R:' + original.r + ' G:' + original.g + ' B:' + original.b + ')',
      '',
    ];

    for (const result of results) {
      lines.push('--- ' + result.type + ' ---');
      lines.push('Simulated:   ' + result.simulatedHex +
        ' (R:' + result.simulatedRgb.r + ' G:' + result.simulatedRgb.g + ' B:' + result.simulatedRgb.b + ')');
      lines.push('Population:  ' + result.affectedPopulation);
      lines.push('Description: ' + result.description);
      lines.push('');
    }

    return lines.join('\n').trim();
  } catch (e) {
    return 'Error: ' + (e instanceof Error ? e.message : 'Invalid input');
  }
}
