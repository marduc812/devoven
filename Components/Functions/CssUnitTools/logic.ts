export interface CssConversionOptions {
  baseFontSize?: number; // default 16px
  viewportWidth?: number; // default 1920
  viewportHeight?: number; // default 1080
  dpi?: number; // default 96
}

export function convertCssUnit(value: number, fromUnit: string, opts: CssConversionOptions = {}): string {
  const { baseFontSize = 16, viewportWidth = 1920, viewportHeight = 1080, dpi = 96 } = opts;
  // First convert to px
  let px: number;
  switch (fromUnit) {
    case 'px': px = value; break;
    case 'rem': px = value * baseFontSize; break;
    case 'em': px = value * baseFontSize; break;
    case 'pt': px = (value * dpi) / 72; break;
    case 'cm': px = (value * dpi) / 2.54; break;
    case 'mm': px = (value * dpi) / 25.4; break;
    case 'in': px = value * dpi; break;
    case 'vw': px = (value / 100) * viewportWidth; break;
    case 'vh': px = (value / 100) * viewportHeight; break;
    case '%': px = (value / 100) * baseFontSize; break;
    default: throw new Error(`Unknown unit: ${fromUnit}`);
  }
  const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();
  return [
    `px:   ${fmt(px)}`,
    `rem:  ${fmt(px / baseFontSize)}`,
    `em:   ${fmt(px / baseFontSize)}`,
    `pt:   ${fmt((px * 72) / dpi)}`,
    `cm:   ${fmt((px * 2.54) / dpi)}`,
    `mm:   ${fmt((px * 25.4) / dpi)}`,
    `in:   ${fmt(px / dpi)}`,
    `vw:   ${fmt((px / viewportWidth) * 100)}%`,
    `vh:   ${fmt((px / viewportHeight) * 100)}%`,
  ].join('\n');
}
