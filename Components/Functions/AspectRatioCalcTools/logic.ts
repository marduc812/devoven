function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

export type ParsedDimensions = { width: number; height: number };

const COMMON_RATIOS: Array<{ rw: number; rh: number; name: string }> = [
  { rw: 1, rh: 1, name: '1:1 (Square)' },
  { rw: 4, rh: 3, name: '4:3 (Standard / VGA)' },
  { rw: 16, rh: 9, name: '16:9 (HD Widescreen)' },
  { rw: 16, rh: 10, name: '16:10 (Widescreen monitor)' },
  { rw: 21, rh: 9, name: '21:9 (Ultrawide)' },
  { rw: 3, rh: 2, name: '3:2 (DSLR / 35mm film)' },
  { rw: 2, rh: 3, name: '2:3 (Portrait)' },
  { rw: 9, rh: 16, name: '9:16 (Vertical / mobile)' },
  { rw: 5, rh: 4, name: '5:4 (SXGA monitor)' },
  { rw: 3, rh: 4, name: '3:4 (Portrait tablet)' },
  { rw: 4, rh: 5, name: '4:5 (Instagram portrait)' },
  { rw: 1, rh: 2, name: '1:2 (Tall portrait)' },
  { rw: 2, rh: 1, name: '2:1 (Panoramic)' },
];

export const COMMON_WIDTHS = [320, 480, 640, 720, 768, 1024, 1280, 1366, 1440, 1920, 2560, 3840];

export function parseDimensions(input: string): ParsedDimensions {
  const s = input.trim();

  // Try "WxH" or "W x H" or "W H" or "W:H"
  const sep = s.match(/^(\d+(?:\.\d+)?)\s*[x×:\s]\s*(\d+(?:\.\d+)?)$/i);
  if (sep) {
    const w = parseFloat(sep[1]);
    const h = parseFloat(sep[2]);
    if (w <= 0 || h <= 0) throw new Error('Width and height must be positive');
    return { width: w, height: h };
  }

  throw new Error('Format not recognized. Use: 1920x1080, 1920 1080, 16:9, or 16 9');
}

export function simplifyRatio(width: number, height: number): { rw: number; rh: number } {
  const d = gcd(Math.round(width), Math.round(height));
  return { rw: width / d, rh: height / d };
}

export function findCommonName(rw: number, rh: number): string | null {
  for (const r of COMMON_RATIOS) {
    if (r.rw === rw && r.rh === rh) return r.name;
  }
  return null;
}

export function generateBreakpointTable(rw: number, rh: number): string {
  const rows: string[] = [
    'Width    Height   Notes',
    '-------- -------- ------',
  ];
  for (const w of COMMON_WIDTHS) {
    const h = Math.round((w * rh) / rw);
    const known = COMMON_RATIOS.find(r => r.rw === rw && r.rh === rh);
    const note = w === 1920 && known ? '(Full HD)' : w === 3840 && known ? '(4K UHD)' : w === 1280 && known ? '(HD)' : '';
    rows.push(String(w).padEnd(9) + String(h).padEnd(9) + note);
  }
  return rows.join('\n');
}

export function findMissingDimension(
  known: 'width' | 'height',
  value: number,
  rw: number,
  rh: number
): string {
  if (known === 'width') {
    const h = Math.round((value * rh) / rw);
    return 'Given width=' + value + ' → height=' + h;
  } else {
    const w = Math.round((value * rw) / rh);
    return 'Given height=' + value + ' → width=' + w;
  }
}

export function formatAspectRatioCalc(input: string): string {
  const { width, height } = parseDimensions(input);
  const { rw, rh } = simplifyRatio(width, height);
  const decimal = width / height;
  const commonName = findCommonName(rw, rh);
  const table = generateBreakpointTable(rw, rh);

  const lines: string[] = [
    '=== Aspect Ratio Calculator ===',
    '',
    'Input: ' + width + ' × ' + height,
    'Simplified ratio: ' + rw + ':' + rh,
    'Decimal: ' + decimal.toFixed(4),
    'Inverse: 1:' + (1 / decimal).toFixed(4),
  ];

  if (commonName) {
    lines.push('Common name: ' + commonName);
  }

  lines.push('', '=== Equivalent Sizes at Common Widths ===', '', table);
  lines.push('', '=== Find Missing Dimension ===', '');
  lines.push(findMissingDimension('width', 1920, rw, rh));
  lines.push(findMissingDimension('height', 1080, rw, rh));

  return lines.join('\n');
}
