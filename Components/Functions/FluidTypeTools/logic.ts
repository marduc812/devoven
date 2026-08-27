// All functions are pure (no browser APIs).

export type FluidTypeInput = {
  minFontPx: number;
  maxFontPx: number;
  minViewportPx: number;
  maxViewportPx: number;
};

export type FluidTypeResult = {
  clampValue: string;
  cssRule: string;
  steps: string[];
  minRem: number;
  maxRem: number;
  slope: number;
  intercept: number;
};

const BASE_FONT_PX = 16;

export function pxToRem(px: number): number {
  return Math.round((px / BASE_FONT_PX) * 10000) / 10000;
}

export function calculateFluidType(input: FluidTypeInput): FluidTypeResult {
  const { minFontPx, maxFontPx, minViewportPx, maxViewportPx } = input;

  if (minFontPx <= 0 || maxFontPx <= 0) throw new Error('Font sizes must be positive');
  if (minViewportPx <= 0 || maxViewportPx <= 0) throw new Error('Viewport sizes must be positive');
  if (minViewportPx >= maxViewportPx) throw new Error('Min viewport must be less than max viewport');

  const minRem = pxToRem(minFontPx);
  const maxRem = pxToRem(maxFontPx);

  // slope = (maxFont - minFont) / (maxVP - minVP) in px
  const slope = (maxFontPx - minFontPx) / (maxViewportPx - minViewportPx);
  // intercept in px = minFontPx - slope * minViewportPx
  const interceptPx = minFontPx - slope * minViewportPx;
  const interceptRem = pxToRem(interceptPx);

  // vw calc: slope * 100vw + interceptRem
  const slopeVw = Math.round(slope * 10000) / 100; // percentage
  const slopeVwStr = slopeVw.toFixed(4) + 'vw';
  const interceptRemStr = (interceptRem >= 0 ? '+ ' : '- ') + Math.abs(interceptRem).toFixed(4) + 'rem';

  const clampPrefer = slopeVwStr + ' ' + interceptRemStr;
  const clampValue = 'clamp(' + minRem.toFixed(4) + 'rem, ' + clampPrefer + ', ' + maxRem.toFixed(4) + 'rem)';
  const cssRule = 'font-size: ' + clampValue + ';';

  const steps = [
    'Step 1: Convert font sizes to rem (base: 16px)',
    '  min font: ' + minFontPx + 'px = ' + minRem.toFixed(4) + 'rem',
    '  max font: ' + maxFontPx + 'px = ' + maxRem.toFixed(4) + 'rem',
    '',
    'Step 2: Calculate slope',
    '  slope = (maxFont - minFont) / (maxVP - minVP)',
    '        = (' + maxFontPx + ' - ' + minFontPx + ') / (' + maxViewportPx + ' - ' + minViewportPx + ')',
    '        = ' + slope.toFixed(6) + ' px/px',
    '',
    'Step 3: Calculate intercept',
    '  intercept = minFont - slope * minVP',
    '            = ' + minFontPx + ' - ' + slope.toFixed(6) + ' * ' + minViewportPx,
    '            = ' + interceptPx.toFixed(4) + 'px = ' + interceptRem.toFixed(4) + 'rem',
    '',
    'Step 4: Build clamp()',
    '  preferred value = slope_as_vw + intercept_in_rem',
    '                  = ' + clampPrefer,
    '',
    'Result:',
    '  ' + cssRule,
  ];

  return { clampValue, cssRule, steps, minRem, maxRem, slope, intercept: interceptRem };
}

export type FluidTypePreset = {
  name: string;
  minFontPx: number;
  maxFontPx: number;
};

export function getFluidTypePresets(): FluidTypePreset[] {
  return [
    { name: 'Body text', minFontPx: 16, maxFontPx: 18 },
    { name: 'Small text', minFontPx: 14, maxFontPx: 16 },
    { name: 'H6 / caption', minFontPx: 15, maxFontPx: 17 },
    { name: 'H5', minFontPx: 16, maxFontPx: 20 },
    { name: 'H4', minFontPx: 18, maxFontPx: 24 },
    { name: 'H3', minFontPx: 20, maxFontPx: 28 },
    { name: 'H2', minFontPx: 24, maxFontPx: 36 },
    { name: 'H1', minFontPx: 32, maxFontPx: 56 },
    { name: 'Display / Hero', minFontPx: 40, maxFontPx: 80 },
  ];
}
