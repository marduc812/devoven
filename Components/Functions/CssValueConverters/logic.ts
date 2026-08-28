export function pxToRem(px: number, baseFontSize = 16): number {
  return px / baseFontSize;
}

export function remToPx(rem: number, baseFontSize = 16): number {
  return rem * baseFontSize;
}

export function convertPxToRemBatch(input: string, baseFontSize = 16): string {
  return input.split('\n').map(line => {
    const match = line.trim().match(/^([\d.]+)\s*(?:px)?$/i);
    if (!match) return line;
    const px = parseFloat(match[1]);
    const rem = pxToRem(px, baseFontSize);
    return `${px}px → ${rem.toFixed(4).replace(/\.?0+$/, '')}rem`;
  }).join('\n');
}

export function convertRemToPxBatch(input: string, baseFontSize = 16): string {
  return input.split('\n').map(line => {
    const match = line.trim().match(/^([\d.]+)\s*(?:rem)?$/i);
    if (!match) return line;
    const rem = parseFloat(match[1]);
    const px = remToPx(rem, baseFontSize);
    return `${rem}rem → ${px.toFixed(4).replace(/\.?0+$/, '')}px`;
  }).join('\n');
}
