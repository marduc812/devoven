// ─── B1. SVG to Data URI ─────────────────────────────────────────────────────

export function svgToDataUri(svg: string): string {
  if (!svg.trim()) return '';
  if (!svg.trim().startsWith('<svg') && !svg.trim().startsWith('<?xml')) {
    throw new Error('Input does not appear to be SVG markup');
  }
  // URL-encode for CSS embedding (more compact than base64 for SVGs)
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/{/g, '%7B')
    .replace(/}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
  return `url("data:image/svg+xml,${encoded}")`;
}

export function svgToBase64DataUri(svg: string): string {
  if (!svg.trim()) return '';
  // btoa works in both Node 16+ and browsers
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}

// ─── B2. CSS Unit Converter ───────────────────────────────────────────────────

export function pxToEm(px: number, baseFontSize: number): number {
  return px / baseFontSize;
}
export function emToPx(em: number, baseFontSize: number): number {
  return em * baseFontSize;
}
export function pxToRem(px: number, rootFontSize: number): number {
  return px / rootFontSize;
}
export function remToPx(rem: number, rootFontSize: number): number {
  return rem * rootFontSize;
}
export function pxToPt(px: number): number {
  return px * 0.75; // 1px = 0.75pt at 96dpi
}
export function ptToPx(pt: number): number {
  return pt / 0.75;
}
export function pxToVw(px: number, viewportWidth: number): number {
  return (px / viewportWidth) * 100;
}
export function pxToVh(px: number, viewportHeight: number): number {
  return (px / viewportHeight) * 100;
}

export function convertCssUnit(value: number, from: string, to: string, baseFontSize = 16, viewportW = 1440, viewportH = 900): number {
  // Convert to px first, then to target
  let px: number;
  switch (from) {
    case 'px': px = value; break;
    case 'em': px = emToPx(value, baseFontSize); break;
    case 'rem': px = remToPx(value, baseFontSize); break;
    case 'pt': px = ptToPx(value); break;
    case 'vw': px = (value / 100) * viewportW; break;
    case 'vh': px = (value / 100) * viewportH; break;
    default: throw new Error('Unknown unit: ' + from);
  }
  switch (to) {
    case 'px': return px;
    case 'em': return pxToEm(px, baseFontSize);
    case 'rem': return pxToRem(px, baseFontSize);
    case 'pt': return pxToPt(px);
    case 'vw': return pxToVw(px, viewportW);
    case 'vh': return pxToVh(px, viewportH);
    default: throw new Error('Unknown unit: ' + to);
  }
}
