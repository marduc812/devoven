// Four-Square Cipher
// Four 5x5 Polybius squares:
//   Top-left (TL): standard alphabet (plaintext)
//   Top-right (TR): key1 square (ciphertext)
//   Bottom-left (BL): key2 square (ciphertext)
//   Bottom-right (BR): standard alphabet (plaintext)
//
// Encrypt digraph (p1, p2):
//   Find p1 in TL -> (r1, c1)
//   Find p2 in BR -> (r2, c2)
//   Cipher letters: TR[r1][c2] and BL[r2][c1]

const STANDARD = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 letters, no J

export function buildSquare(key: string): string[] {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen: Record<string, boolean> = {};
  const sq: string[] = [];

  for (let i = 0; i < k.length; i++) {
    if (!seen[k[i]]) {
      seen[k[i]] = true;
      sq.push(k[i]);
    }
  }

  for (let i = 0; i < STANDARD.length; i++) {
    if (!seen[STANDARD[i]]) {
      seen[STANDARD[i]] = true;
      sq.push(STANDARD[i]);
    }
  }

  return sq;
}

export function standardSquare(): string[] {
  return STANDARD.split('');
}

function findPos(sq: string[], ch: string): { r: number; c: number } {
  const idx = sq.indexOf(ch);
  if (idx === -1) return { r: 0, c: 0 };
  return { r: Math.floor(idx / 5), c: idx % 5 };
}

export function fourSquareEncrypt(text: string, key1: string, key2: string): string {
  if (!key1.trim() || !key2.trim()) throw new Error('Both keys must be provided');
  const TL = standardSquare();
  const TR = buildSquare(key1);
  const BL = buildSquare(key2);
  const BR = standardSquare();

  const t = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  if (t.length === 0) return '';

  const padded = t.length % 2 === 0 ? t : t + 'X';
  let result = '';

  for (let i = 0; i < padded.length; i += 2) {
    const p1 = padded[i];
    const p2 = padded[i + 1];
    const pos1 = findPos(TL, p1);
    const pos2 = findPos(BR, p2);
    result += TR[pos1.r * 5 + pos2.c];
    result += BL[pos2.r * 5 + pos1.c];
  }
  return result;
}

export function fourSquareDecrypt(text: string, key1: string, key2: string): string {
  if (!key1.trim() || !key2.trim()) throw new Error('Both keys must be provided');
  const TL = standardSquare();
  const TR = buildSquare(key1);
  const BL = buildSquare(key2);
  const BR = standardSquare();

  const t = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (t.length === 0) return '';
  if (t.length % 2 !== 0) throw new Error('Ciphertext must have even number of letters');

  let result = '';
  for (let i = 0; i < t.length; i += 2) {
    const c1 = t[i];
    const c2 = t[i + 1];
    const pos1 = findPos(TR, c1); // row from TR -> gives plaintext row in TL
    const pos2 = findPos(BL, c2); // row from BL -> gives plaintext row in BR
    result += TL[pos1.r * 5 + pos2.c];
    result += BR[pos2.r * 5 + pos1.c];
  }
  return result;
}

export function fourSquareDisplay(key1: string, key2: string): string {
  const TL = standardSquare();
  const TR = buildSquare(key1 || 'EXAMPLE');
  const BL = buildSquare(key2 || 'KEYWORD');
  const BR = standardSquare();

  const lines: string[] = ['Four Squares Layout:'];
  lines.push('  [Top-Left: plain]    [Top-Right: key1]');

  for (let r = 0; r < 5; r++) {
    const tl = TL.slice(r * 5, r * 5 + 5).join(' ');
    const tr = TR.slice(r * 5, r * 5 + 5).join(' ');
    lines.push('  ' + tl + '    ' + tr);
  }
  lines.push('');
  lines.push('  [Bot-Left: key2]     [Bot-Right: plain]');
  for (let r = 0; r < 5; r++) {
    const bl = BL.slice(r * 5, r * 5 + 5).join(' ');
    const br = BR.slice(r * 5, r * 5 + 5).join(' ');
    lines.push('  ' + bl + '    ' + br);
  }
  return lines.join('\n');
}

export function processFourSquare(text: string, key1: string, key2: string, mode: 'encrypt' | 'decrypt'): string {
  if (!text.trim()) return '';
  const result = mode === 'encrypt' ? fourSquareEncrypt(text, key1, key2) : fourSquareDecrypt(text, key1, key2);
  const display = fourSquareDisplay(key1, key2);
  return result + '\n\n---\n' + display;
}
