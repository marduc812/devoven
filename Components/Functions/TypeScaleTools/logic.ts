// Typography Scale Generator - logic.ts

export interface ScaleRatio {
  name: string;
  value: number;
}

export const SCALE_RATIOS: ScaleRatio[] = [
  { name: 'Minor Second', value: 1.067 },
  { name: 'Major Second', value: 1.125 },
  { name: 'Minor Third', value: 1.2 },
  { name: 'Major Third', value: 1.25 },
  { name: 'Perfect Fourth', value: 1.333 },
  { name: 'Augmented Fourth', value: 1.414 },
  { name: 'Perfect Fifth', value: 1.5 },
  { name: 'Golden Ratio', value: 1.618 },
];

export interface ScaleStep {
  step: number;       // 0 = base, positive = larger, negative = smaller
  label: string;      // e.g. "xs", "sm", "base", "lg", "xl", "2xl"...
  px: number;
  rem: number;
  em: number;
  cssVar: string;
}

const STEP_LABELS = ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
// steps: -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8  (indices 0..10)

export function generateScale(basePx: number, ratio: number, rootPx: number = 16): ScaleStep[] {
  const steps: ScaleStep[] = [];
  // 2 steps down, 8 steps up from base (index 0 = -2, index 2 = base, index 10 = +8)
  for (let i = -2; i <= 8; i++) {
    const scaledPx = basePx * Math.pow(ratio, i);
    const roundedPx = Math.round(scaledPx * 100) / 100;
    const rem = Math.round((scaledPx / rootPx) * 1000) / 1000;
    const em = Math.round((scaledPx / basePx) * 1000) / 1000;
    const labelIndex = i + 2; // shift by 2 so -2 maps to 0
    const label = STEP_LABELS[labelIndex] || (i > 8 ? `${i}xl` : `step${i}`);
    steps.push({
      step: i,
      label,
      px: roundedPx,
      rem,
      em,
      cssVar: `--text-${label}`,
    });
  }
  return steps;
}

export function formatScale(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Parse input: "16 1.333" or "16px 1.333" or "16 perfect fourth" or "1rem 1.25"
  const lines_in = trimmed.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const line = lines_in[0];

  let basePx = 16;
  let ratio = 1.333;
  let rootPx = 16;
  let ratioName = 'Perfect Fourth';

  const parts = line.split(/\s+/);

  // First part: base size
  if (parts[0]) {
    const baseStr = parts[0].replace(/px$/i, '');
    const baseNum = parseFloat(baseStr);
    if (!isNaN(baseNum) && baseNum > 0) {
      if (parts[0].toLowerCase().endsWith('rem')) {
        basePx = baseNum * rootPx;
      } else {
        basePx = baseNum;
      }
    }
  }

  // Second part: ratio or preset name
  if (parts.length >= 2) {
    const rest = parts.slice(1).join(' ').toLowerCase();
    // Check preset names
    const preset = SCALE_RATIOS.find(r => rest.includes(r.name.toLowerCase()) || rest === r.value.toString());
    if (preset) {
      ratio = preset.value;
      ratioName = preset.name;
    } else {
      const ratioNum = parseFloat(parts[1]);
      if (!isNaN(ratioNum) && ratioNum > 1) {
        ratio = ratioNum;
        ratioName = `Custom (${ratio})`;
      }
    }
  } else {
    // If only base provided, default to perfect fourth
    ratio = 1.333;
    ratioName = 'Perfect Fourth';
  }

  // Optional third: root px
  if (parts.length >= 3) {
    const rootNum = parseFloat(parts[2]);
    if (!isNaN(rootNum) && rootNum > 0) rootPx = rootNum;
  }

  const scale = generateScale(basePx, ratio, rootPx);

  const outputLines: string[] = [];
  outputLines.push(`=== Typography Scale ===`);
  outputLines.push(`Base: ${basePx}px | Ratio: ${ratio} (${ratioName}) | Root: ${rootPx}px`);
  outputLines.push('');
  outputLines.push('Step   Label   px        rem      em');
  outputLines.push('─'.repeat(50));
  for (const s of scale) {
    const step = (s.step >= 0 ? '+' + s.step : '' + s.step).padEnd(3);
    const label = s.label.padEnd(8);
    const px = (s.px + 'px').padEnd(10);
    const rem = (s.rem + 'rem').padEnd(9);
    const em = s.em + 'em';
    outputLines.push(`${step}    ${label}${px}${rem}${em}`);
  }

  outputLines.push('');
  outputLines.push('=== CSS Custom Properties ===');
  outputLines.push('');
  outputLines.push(':root {');
  for (const s of scale) {
    outputLines.push(`  ${s.cssVar}: ${s.rem}rem;  /* ${s.px}px */`);
  }
  outputLines.push('}');

  outputLines.push('');
  outputLines.push('=== Available Presets ===');
  outputLines.push('');
  for (const r of SCALE_RATIOS) {
    outputLines.push(`  ${r.value}  ${r.name}`);
  }
  outputLines.push('');
  outputLines.push('Usage: Enter "16 1.333" or "16 perfect fourth" or "14px golden ratio"');

  return outputLines.join('\n');
}
