export function minifyJson(input: string): string {
  const parsed = JSON.parse(input); // throws on invalid JSON
  return JSON.stringify(parsed);
}

export function beautifyJson(input: string, indent: number | string = 2): string {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

export function getJsonStats(minified: string, beautified: string): string {
  const mSize = new TextEncoder().encode(minified).length;
  const bSize = new TextEncoder().encode(beautified).length;
  const savings = bSize - mSize;
  const pct = bSize > 0 ? Math.round((savings / bSize) * 100) : 0;
  return `Minified: ${mSize} bytes | Beautified: ${bSize} bytes | Savings: ${savings} bytes (${pct}%)`;
}
