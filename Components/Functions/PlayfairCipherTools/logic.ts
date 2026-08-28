// Playfair cipher: 5x5 key square, I/J combined

export function buildPlayfairSquare(key: string): string[] {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen: Record<string, boolean> = {};
  const square: string[] = [];

  for (let i = 0; i < k.length; i++) {
    if (!seen[k[i]]) {
      seen[k[i]] = true;
      square.push(k[i]);
    }
  }

  const ALPHA = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // no J
  for (let i = 0; i < ALPHA.length; i++) {
    if (!seen[ALPHA[i]]) {
      seen[ALPHA[i]] = true;
      square.push(ALPHA[i]);
    }
  }

  return square; // 25 chars
}

function getPos(square: string[], ch: string): { row: number; col: number } {
  const idx = square.indexOf(ch);
  return { row: Math.floor(idx / 5), col: idx % 5 };
}

function prepareText(text: string, forEncrypt: boolean): string {
  let t = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  if (forEncrypt) {
    let result = '';
    let i = 0;
    while (i < t.length) {
      const a = t[i];
      const b = t[i + 1] || 'X';
      result += a;
      if (a === b) {
        result += 'X';
        i++;
      } else {
        result += b;
        i += 2;
      }
    }
    if (result.length % 2 !== 0) result += 'X';
    return result;
  }
  return t;
}

function processDigraph(square: string[], a: string, b: string, mode: 'encrypt' | 'decrypt'): string {
  const pa = getPos(square, a);
  const pb = getPos(square, b);
  const dir = mode === 'encrypt' ? 1 : -1;

  if (pa.row === pb.row) {
    // Same row: shift columns
    const ca = (pa.col + dir + 5) % 5;
    const cb = (pb.col + dir + 5) % 5;
    return square[pa.row * 5 + ca] + square[pb.row * 5 + cb];
  } else if (pa.col === pb.col) {
    // Same col: shift rows
    const ra = (pa.row + dir + 5) % 5;
    const rb = (pb.row + dir + 5) % 5;
    return square[ra * 5 + pa.col] + square[rb * 5 + pb.col];
  } else {
    // Rectangle: swap columns
    return square[pa.row * 5 + pb.col] + square[pb.row * 5 + pa.col];
  }
}

export function playfairEncrypt(text: string, key: string): string {
  if (!key.trim()) throw new Error('Key cannot be empty');
  const square = buildPlayfairSquare(key);
  const prepared = prepareText(text, true);
  if (prepared.length === 0) return '';

  let result = '';
  for (let i = 0; i < prepared.length; i += 2) {
    result += processDigraph(square, prepared[i], prepared[i + 1], 'encrypt');
  }
  return result;
}

export function playfairDecrypt(text: string, key: string): string {
  if (!key.trim()) throw new Error('Key cannot be empty');
  const square = buildPlayfairSquare(key);
  const t = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (t.length === 0) return '';
  if (t.length % 2 !== 0) throw new Error('Ciphertext must have even number of letters');

  let result = '';
  for (let i = 0; i < t.length; i += 2) {
    result += processDigraph(square, t[i], t[i + 1], 'decrypt');
  }
  return result;
}

export function playfairSquareDisplay(key: string): string {
  const square = buildPlayfairSquare(key);
  const lines: string[] = ['5x5 Key Square:'];
  for (let r = 0; r < 5; r++) {
    lines.push(square.slice(r * 5, r * 5 + 5).join(' '));
  }
  return lines.join('\n');
}

export function playfairSteps(text: string, key: string, mode: 'encrypt' | 'decrypt'): string {
  const square = buildPlayfairSquare(key);
  const prepared = mode === 'encrypt' ? prepareText(text, true) : text.toUpperCase().replace(/[^A-Z]/g, '');
  if (prepared.length === 0) return '';

  const lines: string[] = ['Digraph steps:'];
  for (let i = 0; i < Math.min(prepared.length, 20); i += 2) {
    const a = prepared[i];
    const b = prepared[i + 1] || 'X';
    const out = processDigraph(square, a, b, mode);
    lines.push(a + b + ' => ' + out);
  }
  return lines.join('\n');
}

export function processPlayfair(text: string, key: string, mode: 'encrypt' | 'decrypt'): string {
  if (!text.trim()) return '';
  const result = mode === 'encrypt' ? playfairEncrypt(text, key) : playfairDecrypt(text, key);
  const squareDisplay = playfairSquareDisplay(key);
  const steps = playfairSteps(mode === 'encrypt' ? text : text.toUpperCase().replace(/[^A-Z]/g, ''), key, mode);
  return result + '\n\n---\n' + squareDisplay + '\n\n' + steps;
}
