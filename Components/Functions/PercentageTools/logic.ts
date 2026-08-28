export function parsePercentageQuery(input: string): string {
  const s = input.trim().toLowerCase();
  let m: RegExpMatchArray | null;

  // "X% of Y"
  m = s.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s+(\d+(?:\.\d+)?)$/);
  if (m) {
    const pct = parseFloat(m[1]);
    const whole = parseFloat(m[2]);
    const result = (pct / 100) * whole;
    return `${pct}% of ${whole} = ${result.toFixed(4).replace(/\.?0+$/, '')}`;
  }

  // "X is what % of Y"
  m = s.match(/^(\d+(?:\.\d+)?)\s+is\s+what\s+%\s+of\s+(\d+(?:\.\d+)?)$/);
  if (m) {
    const part = parseFloat(m[1]);
    const whole = parseFloat(m[2]);
    if (whole === 0) throw new Error('Cannot divide by zero');
    const pct = (part / whole) * 100;
    return `${part} is ${pct.toFixed(4).replace(/\.?0+$/, '')}% of ${whole}`;
  }

  // "X increased by Y%"
  m = s.match(/^(\d+(?:\.\d+)?)\s+(?:increased|increase)\s+by\s+(\d+(?:\.\d+)?)\s*%$/);
  if (m) {
    const base = parseFloat(m[1]);
    const pct = parseFloat(m[2]);
    const result = base + base * pct / 100;
    return `${base} increased by ${pct}% = ${result.toFixed(4).replace(/\.?0+$/, '')}`;
  }

  // "X decreased by Y%"
  m = s.match(/^(\d+(?:\.\d+)?)\s+(?:decreased|decrease)\s+by\s+(\d+(?:\.\d+)?)\s*%$/);
  if (m) {
    const base = parseFloat(m[1]);
    const pct = parseFloat(m[2]);
    const result = base - base * pct / 100;
    return `${base} decreased by ${pct}% = ${result.toFixed(4).replace(/\.?0+$/, '')}`;
  }

  // "% change from X to Y"
  m = s.match(/^(?:what is the )?%\s*change\s+from\s+(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)$/);
  if (m) {
    const from = parseFloat(m[1]);
    const to = parseFloat(m[2]);
    if (from === 0) throw new Error('Cannot calculate percentage change from 0');
    const pct = ((to - from) / from) * 100;
    const dir = pct >= 0 ? 'increase' : 'decrease';
    return `${from} to ${to} is a ${Math.abs(pct).toFixed(2).replace(/\.?0+$/, '')}% ${dir}`;
  }

  throw new Error(
    `Cannot parse. Try:\n` +
    `  "25% of 200"\n` +
    `  "50 is what % of 200"\n` +
    `  "100 increased by 15%"\n` +
    `  "200 decreased by 10%"\n` +
    `  "% change from 50 to 75"`
  );
}
