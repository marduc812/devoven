export function indexOfCoincidence(text: string) {
  const counts = new Array<number>(26).fill(0);
  let letters = 0;
  for (const letter of text) {
    const code = letter.charCodeAt(0);
    const index = code >= 65 && code <= 90 ? code - 65 : code >= 97 && code <= 122 ? code - 97 : -1;
    if (index >= 0) { counts[index]++; letters++; }
  }
  // Unscaled IC: https://pages.mtu.edu/~shene/NSF-4/Tutorial/VIG/Vig-IOC.html
  const pairs = counts.reduce((sum, count) => sum + count * (count - 1), 0);
  const ic = letters < 2 ? null : pairs / (letters * (letters - 1));
  return { letters, counts, ic, normalized: ic === null ? null : ic * 26 };
}

export function formatIndexOfCoincidence(text: string): string {
  const result = indexOfCoincidence(text);
  if (result.ic === null) return `Letters counted: ${result.letters}\nAt least two A-Z letters are required.`;
  return [
    `Letters counted: ${result.letters}`,
    `Index of coincidence: ${result.ic.toFixed(6)}`,
    `Normalized IC, multiplied by 26: ${result.normalized!.toFixed(6)}`,
    'Formula: sum of f * (f - 1) / (N * (N - 1))',
    '',
    'Letter counts:',
    ...result.counts.map((count, i) => `${String.fromCharCode(65 + i)}: ${count}`),
  ].join('\n');
}
