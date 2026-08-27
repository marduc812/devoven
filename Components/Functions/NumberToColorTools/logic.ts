export function stringToHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }
  return hash;
}

export function hashToColor(hash: number): string {
  const r = (hash >> 16) & 0xFF;
  const g = (hash >> 8) & 0xFF;
  const b = hash & 0xFF;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

export function stringToColor(s: string): string {
  return hashToColor(stringToHash(s));
}

export function generateColorVariants(input: string): string {
  const num = parseFloat(input.trim());
  const isNum = !isNaN(num) && input.trim() !== '';

  const hash = isNum ? (Math.abs(Math.round(num)) >>> 0) : stringToHash(input.trim());
  const baseHex = hashToColor(hash);

  // Generate complementary and analogous
  const r = (hash >> 16) & 0xFF;
  const g = (hash >> 8) & 0xFF;
  const b = hash & 0xFF;
  const complementary = '#' + [255 - r, 255 - g, 255 - b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');

  // Lighter version (mix with white)
  const lighter = '#' + [r, g, b].map(v => Math.round(v + (255 - v) * 0.5)).map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
  // Darker version (mix with black)
  const darker = '#' + [r, g, b].map(v => Math.round(v * 0.5)).map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');

  return [
    `Input:          "${input}"`,
    `Type:           ${isNum ? 'Number' : 'String'}`,
    `Hash:           ${hash}`,
    ``,
    `Base color:     ${baseHex}   rgb(${r}, ${g}, ${b})`,
    `Complementary:  ${complementary}`,
    `Lighter:        ${lighter}`,
    `Darker:         ${darker}`,
    ``,
    `CSS Usage:`,
    `  color: ${baseHex};`,
    `  background-color: ${lighter};`,
    `  border-color: ${darker};`,
  ].join('\n');
}
