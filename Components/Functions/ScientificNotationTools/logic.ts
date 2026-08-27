export function toScientific(input: string): string {
  const n = parseFloat(input.trim());
  if (isNaN(n)) throw new Error('Enter a valid number');

  const exp = n !== 0 ? Math.floor(Math.log10(Math.abs(n))) : 0;
  const coefficient = n !== 0 ? n / Math.pow(10, exp) : 0;

  return [
    `Number:              ${n}`,
    `Scientific:          ${coefficient.toFixed(6).replace(/\.?0+$/, '')}e${exp >= 0 ? '+' : ''}${exp}`,
    `Engineering:         ${toEngineering(n)}`,
    `Exponential:         ${n.toExponential()}`,
    `Exponent:            10^${exp}`,
    `Coefficient:         ${coefficient.toFixed(8).replace(/\.?0+$/, '')}`,
  ].join('\n');
}

export function toEngineering(n: number): string {
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const engExp = Math.floor(exp / 3) * 3;
  const coeff = n / Math.pow(10, engExp);
  return `${coeff.toFixed(3).replace(/\.?0+$/, '')}e${engExp >= 0 ? '+' : ''}${engExp}`;
}

export function fromScientific(input: string): string {
  // Parse "1.5e+3" or "1.5 × 10^3" or "1.5 * 10^3"
  const cleaned = input.trim().replace(/×|x/gi, '*').replace(/\^/g, 'e');
  const n = parseFloat(cleaned);
  if (isNaN(n)) throw new Error('Enter scientific notation like "1.5e+3" or "1.5e3"');
  return n.toLocaleString('en-US', { maximumSignificantDigits: 15 });
}

export function convertScientific(input: string): string {
  const trimmed = input.trim();
  // If contains 'e' (case-insensitive), try fromScientific
  if (/e/i.test(trimmed) || trimmed.includes('^')) {
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed)) {
      return `From scientific:\n${parsed.toLocaleString('en-US', { maximumSignificantDigits: 15 })}`;
    }
  }
  return toScientific(trimmed);
}
