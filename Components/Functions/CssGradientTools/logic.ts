// ─── CSS Gradient Generator ───────────────────────────────────────────────────
// Input: simple config format
//   type: linear | radial | conic
//   angle: 135          (for linear, degrees)
//   shape: circle       (for radial: circle | ellipse)
//   colors: #ff0000 0%, #0000ff 100%
// Output: CSS background property value + vendor prefixes

export type GradientConfig = {
  type: 'linear' | 'radial' | 'conic';
  angle: number;     // for linear: degrees; for conic: starting angle
  shape: string;     // for radial: 'circle' | 'ellipse'
  colors: string;    // e.g. "#ff0000 0%, #0000ff 100%"
};

export type GradientOutput = {
  standard: string;
  webkit: string;
  moz: string;
  cssProperty: string;
};

const DEFAULT_CONFIG: GradientConfig = {
  type: 'linear',
  angle: 135,
  shape: 'ellipse',
  colors: '#ff0000 0%, #0000ff 100%',
};

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseGradientConfig(input: string): GradientConfig {
  const config = Object.assign({}, DEFAULT_CONFIG);
  const lines = input.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (key === 'type') {
      const v = value.toLowerCase();
      if (v === 'linear' || v === 'radial' || v === 'conic') {
        config.type = v;
      }
    } else if (key === 'angle') {
      const n = parseFloat(value);
      if (!isNaN(n)) config.angle = n;
    } else if (key === 'shape') {
      config.shape = value.toLowerCase();
    } else if (key === 'colors') {
      config.colors = value;
    }
  }

  return config;
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validateColors(colors: string): void {
  if (!colors.trim()) throw new Error('colors field is required (e.g. #ff0000 0%, #0000ff 100%)');
  // Basic check: must have at least two color stops
  const stops = colors.split(',');
  if (stops.length < 2) throw new Error('At least two color stops are required (comma-separated)');
}

// ─── Generator ───────────────────────────────────────────────────────────────

export function generateGradient(config: GradientConfig): GradientOutput {
  validateColors(config.colors);
  const colors = config.colors.trim();

  let standard = '';
  let webkit = '';
  let moz = '';

  if (config.type === 'linear') {
    const angle = config.angle + 'deg';
    standard = 'linear-gradient(' + angle + ', ' + colors + ')';
    webkit = '-webkit-linear-gradient(' + angle + ', ' + colors + ')';
    moz = '-moz-linear-gradient(' + angle + ', ' + colors + ')';
  } else if (config.type === 'radial') {
    const shape = config.shape || 'ellipse';
    standard = 'radial-gradient(' + shape + ' at center, ' + colors + ')';
    webkit = '-webkit-radial-gradient(center, ' + shape + ', ' + colors + ')';
    moz = '-moz-radial-gradient(center, ' + shape + ', ' + colors + ')';
  } else if (config.type === 'conic') {
    const angle = config.angle + 'deg';
    standard = 'conic-gradient(from ' + angle + ', ' + colors + ')';
    // conic-gradient has no widely-used vendor prefix
    webkit = standard;
    moz = standard;
  }

  const cssProperty =
    'background: ' + webkit + ';\n' +
    'background: ' + moz + ';\n' +
    'background: ' + standard + ';';

  return { standard, webkit, moz, cssProperty };
}

export function formatGradientOutput(output: GradientOutput): string {
  const lines: string[] = [];
  lines.push('/* Standard */');
  lines.push('background: ' + output.standard + ';');
  lines.push('');
  lines.push('/* With vendor prefixes */');
  lines.push('background: ' + output.webkit + ';');
  lines.push('background: ' + output.moz + ';');
  lines.push('background: ' + output.standard + ';');
  lines.push('');
  lines.push('/* Shorthand (copy-paste ready) */');
  lines.push(output.cssProperty);
  return lines.join('\n');
}

export function processGradientInput(input: string): string {
  const config = parseGradientConfig(input);
  const output = generateGradient(config);
  return formatGradientOutput(output);
}

// Template for new users
export const GRADIENT_TEMPLATE = `type: linear
angle: 135
colors: #ff0000 0%, #0000ff 100%`;

export const GRADIENT_EXAMPLES: Array<{ label: string; config: string }> = [
  {
    label: 'Linear (diagonal)',
    config: 'type: linear\nangle: 135\ncolors: #667eea 0%, #764ba2 100%',
  },
  {
    label: 'Linear (horizontal)',
    config: 'type: linear\nangle: 90\ncolors: #f093fb 0%, #f5576c 100%',
  },
  {
    label: 'Radial (circle)',
    config: 'type: radial\nshape: circle\ncolors: #4facfe 0%, #00f2fe 100%',
  },
  {
    label: 'Three-color',
    config: 'type: linear\nangle: 45\ncolors: #ff6b6b 0%, #feca57 50%, #48dbfb 100%',
  },
  {
    label: 'Conic',
    config: 'type: conic\nangle: 0\ncolors: #ff0000 0%, #ff8000 16%, #ffff00 33%, #00ff00 50%, #0000ff 66%, #8000ff 83%, #ff0000 100%',
  },
];
