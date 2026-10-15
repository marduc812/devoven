export interface IbanCountry {
  code: string;
  name: string;
  /** SWIFT notation: n = digit, a = uppercase letter, c = alphanumeric. */
  pattern: string;
  structure: string;
}

// Country-specific BBAN character formats.
// Brazil and Dominican Republic character classes follow SWIFT registry release 103.
// https://www.swift.com/resource/iban-registry-pdf
// These describe format only. Bank identifiers and domestic checks are not verified.
export const IBAN_COUNTRIES: readonly IbanCountry[] = [
  { code: 'AD', name: 'Andorra', pattern: '4n4n12c', structure: 'Bank 4 + branch 4 + account 12' },
  { code: 'AT', name: 'Austria', pattern: '5n11n', structure: 'Bank 5 + account 11' },
  { code: 'BE', name: 'Belgium', pattern: '3n7n2n', structure: 'Bank 3 + account 7 + domestic check 2' },
  { code: 'BR', name: 'Brazil', pattern: '8c5n10n1c1c', structure: 'Bank 8 + branch 5 + account 10 + type 1 + owner 1' },
  { code: 'BG', name: 'Bulgaria', pattern: '4a4n2n8c', structure: 'Bank 4 + branch 4 + type 2 + account 8' },
  { code: 'CR', name: 'Costa Rica', pattern: '1n3n14n', structure: 'Reserved zero 1 + bank 3 + account 14' },
  { code: 'HR', name: 'Croatia', pattern: '7n10n', structure: 'Bank 7 + account 10' },
  { code: 'CY', name: 'Cyprus', pattern: '3n5n16c', structure: 'Bank 3 + branch 5 + account 16' },
  { code: 'CZ', name: 'Czechia', pattern: '4n16n', structure: 'Bank 4 + account 16' },
  { code: 'DK', name: 'Denmark', pattern: '4n10n', structure: 'Bank 4 + account 10' },
  { code: 'DO', name: 'Dominican Republic', pattern: '4c20n', structure: 'Bank 4 + account 20' },
  { code: 'EE', name: 'Estonia', pattern: '2n2n11n1n', structure: 'Bank 2 + branch 2 + account 11 + domestic check 1' },
  { code: 'FI', name: 'Finland', pattern: '6n8n', structure: 'Bank 6 + account 8' },
  { code: 'FR', name: 'France', pattern: '5n5n11c2n', structure: 'Bank 5 + branch 5 + account 11 + domestic key 2' },
  { code: 'DE', name: 'Germany', pattern: '8n10n', structure: 'Bank 8 + account 10' },
  { code: 'GR', name: 'Greece', pattern: '3n4n16c', structure: 'Bank 3 + branch 4 + account 16' },
  { code: 'HU', name: 'Hungary', pattern: '3n4n1n15n1n', structure: 'Bank 3 + branch 4 + domestic check 1 + account 15 + domestic check 1' },
  { code: 'IS', name: 'Iceland', pattern: '4n2n6n10n', structure: 'Bank 4 + type 2 + account 6 + identifier 10' },
  { code: 'IE', name: 'Ireland', pattern: '4a6n8n', structure: 'Bank 4 + branch 6 + account 8' },
  { code: 'IL', name: 'Israel', pattern: '3n3n13n', structure: 'Bank 3 + branch 3 + account 13' },
  { code: 'IT', name: 'Italy', pattern: '1a5n5n12c', structure: 'CIN 1 + bank 5 + branch 5 + account 12' },
  { code: 'LV', name: 'Latvia', pattern: '4a13c', structure: 'Bank 4 + account 13' },
  { code: 'LI', name: 'Liechtenstein', pattern: '5n12c', structure: 'Bank 5 + account 12' },
  { code: 'LT', name: 'Lithuania', pattern: '5n11n', structure: 'Bank 5 + account 11' },
  { code: 'LU', name: 'Luxembourg', pattern: '3n13c', structure: 'Bank 3 + account 13' },
  { code: 'MT', name: 'Malta', pattern: '4a5n18c', structure: 'Bank 4 + branch 5 + account 18' },
  { code: 'NL', name: 'Netherlands', pattern: '4a10n', structure: 'Bank 4 + account 10' },
  { code: 'NO', name: 'Norway', pattern: '4n7n', structure: 'Bank 4 + account 7' },
  { code: 'PL', name: 'Poland', pattern: '8n16n', structure: 'Bank 8 + account 16' },
  { code: 'PT', name: 'Portugal', pattern: '4n4n11n2n', structure: 'Bank 4 + branch 4 + account 11 + domestic check 2' },
  { code: 'QA', name: 'Qatar', pattern: '4a21c', structure: 'Bank 4 + account 21' },
  { code: 'RO', name: 'Romania', pattern: '4a16c', structure: 'Bank 4 + account 16' },
  { code: 'SA', name: 'Saudi Arabia', pattern: '2n18c', structure: 'Bank 2 + account 18' },
  { code: 'RS', name: 'Serbia', pattern: '3n13n2n', structure: 'Bank 3 + account 13 + domestic check 2' },
  { code: 'SK', name: 'Slovakia', pattern: '4n16n', structure: 'Bank 4 + account 16' },
  { code: 'SI', name: 'Slovenia', pattern: '5n8n2n', structure: 'Bank 5 + account 8 + domestic check 2' },
  { code: 'ES', name: 'Spain', pattern: '4n4n2n10n', structure: 'Bank 4 + branch 4 + domestic check 2 + account 10' },
  { code: 'SE', name: 'Sweden', pattern: '3n17n', structure: 'Bank 3 + account 17' },
  { code: 'CH', name: 'Switzerland', pattern: '5n12c', structure: 'Bank 5 + account 12' },
  { code: 'TR', name: 'Türkiye', pattern: '5n1n16c', structure: 'Bank 5 + reserved zero 1 + account 16' },
  { code: 'AE', name: 'United Arab Emirates', pattern: '3n16n', structure: 'Bank 3 + account 16' },
  { code: 'GB', name: 'United Kingdom', pattern: '4a6n8n', structure: 'Bank 4 + sort code 6 + account 8' },
];

const ALPHABETS = { n: '0123456789', a: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', c: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' };

export function getCountry(code: string): IbanCountry {
  const country = IBAN_COUNTRIES.find(country => country.code === code);
  if (!country) throw new Error('Select a supported country.');
  return country;
}

function patternParts(pattern: string): { length: number; alphabet: string }[] {
  return Array.from(pattern.matchAll(/(\d+)([nac])/g), match => ({
    length: Number(match[1]), alphabet: ALPHABETS[match[2] as keyof typeof ALPHABETS],
  }));
}

export function ibanLength(country: IbanCountry): number {
  return 4 + patternParts(country.pattern).reduce((sum, part) => sum + part.length, 0);
}

/** Rejection sampling avoids favoring characters when 256 is not divisible by the alphabet size. */
function randomCharacter(alphabet: string): string {
  const byte = new Uint8Array(1);
  const limit = 256 - (256 % alphabet.length);
  do { crypto.getRandomValues(byte); } while (byte[0] >= limit);
  return alphabet[byte[0] % alphabet.length];
}

/** Process one decimal digit at a time, so long IBANs never lose integer precision. */
export function mod97(value: string): number {
  if (!/^[A-Z0-9]+$/.test(value)) throw new Error('Expected uppercase letters and digits.');
  let remainder = 0;
  for (const char of value) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}

export function ibanCheckDigits(code: string, bban: string): string {
  return String(98 - mod97(`${bban}${code}00`)).padStart(2, '0');
}

export function generateIban(code: string): string {
  const country = getCountry(code);
  let bban = patternParts(country.pattern).map(part =>
    Array.from({ length: part.length }, () => randomCharacter(part.alphabet)).join(''),
  ).join('');
  if (code === 'TR') bban = bban.slice(0, 5) + '0' + bban.slice(6);
  if (code === 'CR') bban = '0' + bban.slice(1);
  return code + ibanCheckDigits(code, bban) + bban;
}

export function generateIbans(code: string, quantity: number): string[] {
  getCountry(code);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error('Quantity must be a whole number from 1 to 100.');
  }
  return Array.from({ length: quantity }, () => generateIban(code));
}

export function formatIban(iban: string): string {
  return iban.match(/.{1,4}/g)?.join(' ') ?? '';
}

export type ExportFormat = 'txt' | 'csv' | 'json';
export function exportIbans(ibans: readonly string[], format: ExportFormat): string {
  if (format === 'json') return JSON.stringify({ ibans }, null, 2);
  if (format === 'csv') return 'IBAN\r\n' + ibans.join('\r\n') + '\r\n';
  return ibans.join('\n') + '\n';
}
