export type BaconRepresentation = 'AB' | '01';

// Bacon's biliteral cipher: each letter maps to a 5-bit code
// A=AAAAA, B=AAAAB, ..., I/J=ABAAA, ..., Z=BBBBB
// Letters I and J share the same code (ABAAA = 8)
const BACON_TABLE: string[] = [
  'AAAAA', // A = 0
  'AAAAB', // B = 1
  'AAABA', // C = 2
  'AAABB', // D = 3
  'AABAA', // E = 4
  'AABAB', // F = 5
  'AABBA', // G = 6
  'AABBB', // H = 7
  'ABAAA', // I/J = 8
  'ABAAA', // J = 8 (same as I)
  'ABAAB', // K = 9 (index 10 -> letter K, but offset by 1 for J)
  'ABABA', // L
  'ABABB', // M
  'ABBAA', // N
  'ABBAB', // O
  'ABBBA', // P
  'ABBBB', // Q
  'BAAAA', // R
  'BAAAB', // S
  'BAABA', // T
  'BAABB', // U/V
  'BAABB', // V (same as U)
  'BABAA', // W
  'BABAB', // X
  'BABBA', // Y
  'BABBB', // Z
];

// Build decode map: code -> letter (first letter wins for duplicates)
const DECODE_MAP: Record<string, string> = {};
for (let i = 0; i < BACON_TABLE.length; i++) {
  const code = BACON_TABLE[i];
  const letter = String.fromCharCode(65 + i);
  if (!DECODE_MAP[code]) DECODE_MAP[code] = letter;
}

export function encodeToBacon(text: string, repr: BaconRepresentation): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const idx = ch.charCodeAt(0) - 65;
    if (idx >= 0 && idx < BACON_TABLE.length) {
      let code = BACON_TABLE[idx];
      if (repr === '01') code = code.replace(/A/g, '0').replace(/B/g, '1');
      result.push(code);
    } else {
      result.push(text[i]); // preserve non-alpha as-is
    }
  }
  return result.join(' ');
}

export function decodeFromBacon(text: string, repr: BaconRepresentation): string {
  // Normalize to AB representation
  let normalized = text.trim();
  if (repr === '01') {
    normalized = normalized.replace(/0/g, 'A').replace(/1/g, 'B');
  }
  // Split on whitespace and/or spaces
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toUpperCase();
    if (/^[AB]{5}$/.test(token)) {
      const letter = DECODE_MAP[token];
      result.push(letter ? letter : '?');
    } else {
      result.push(token);
    }
  }
  return result.join('');
}

export function isBaconEncoded(text: string, repr: BaconRepresentation): boolean {
  const trimmed = text.trim();
  if (repr === '01') {
    return /^[01\s]+$/.test(trimmed) && /([01]{5})/.test(trimmed.replace(/\s/g, ''));
  }
  return /^[AB\s]+$/.test(trimmed.toUpperCase()) && /([AB]{5})/.test(trimmed.toUpperCase().replace(/\s/g, ''));
}

export function processBacon(text: string, repr: BaconRepresentation): string {
  if (!text.trim()) return '';
  if (isBaconEncoded(text, repr)) {
    const decoded = decodeFromBacon(text, repr);
    return 'Mode: Decode\n\nPlaintext: ' + decoded;
  }
  const encoded = encodeToBacon(text, repr);
  return 'Mode: Encode\n\nBacon codes:\n' + encoded;
}

