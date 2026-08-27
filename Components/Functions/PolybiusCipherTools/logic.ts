const DEFAULT_ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 letters, I/J combined

export function buildSquare(keyword: string): string {
  // Build alphabet from keyword + remaining letters
  const upper = keyword.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen: Record<string, boolean> = {};
  const letters: string[] = [];

  for (let i = 0; i < upper.length; i++) {
    if (!seen[upper[i]]) {
      seen[upper[i]] = true;
      letters.push(upper[i]);
    }
  }
  for (let i = 0; i < DEFAULT_ALPHABET.length; i++) {
    const ch = DEFAULT_ALPHABET[i];
    if (!seen[ch]) {
      seen[ch] = true;
      letters.push(ch);
    }
  }
  return letters.join('');
}

export function squareToGrid(square: string): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      row.push(square[r * 5 + c]);
    }
    grid.push(row);
  }
  return grid;
}

export function encodePolybius(text: string, square: string): string {
  const grid = squareToGrid(square);
  const posMap: Record<string, string> = {};
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      posMap[grid[r][c]] = String(r + 1) + String(c + 1);
    }
  }
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    let ch = text[i].toUpperCase();
    if (ch === 'J') ch = 'I';
    if (posMap[ch]) {
      result.push(posMap[ch]);
    } else {
      result.push(text[i]);
    }
  }
  return result.join(' ');
}

export function decodePolybius(text: string, square: string): string {
  const grid = squareToGrid(square);
  const tokens = text.trim().split(/\s+/);
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^[1-5][1-5]$/.test(token)) {
      const r = parseInt(token[0]) - 1;
      const c = parseInt(token[1]) - 1;
      result.push(grid[r][c]);
    } else {
      result.push(token);
    }
  }
  return result.join('');
}

export function isPolybiusEncoded(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  const numericCount = tokens.filter(t => /^[1-5][1-5]$/.test(t)).length;
  return numericCount > 0 && numericCount >= tokens.length * 0.7;
}

export function renderSquare(square: string): string {
  const grid = squareToGrid(square);
  const lines: string[] = ['  | 1  2  3  4  5', '--+----------------'];
  for (let r = 0; r < 5; r++) {
    lines.push(String(r + 1) + ' | ' + grid[r].join('  '));
  }
  return lines.join('\n');
}

export function processPolybius(text: string, keyword: string): string {
  if (!text.trim()) return '';
  const square = buildSquare(keyword);
  const squareDisplay = renderSquare(square);

  if (isPolybiusEncoded(text)) {
    const decoded = decodePolybius(text, square);
    return 'Mode: Decode\n\nPlaintext: ' + decoded + '\n\n---\nPolybius Square:\n' + squareDisplay;
  }
  const encoded = encodePolybius(text, square);
  return 'Mode: Encode\n\nCiphertext:\n' + encoded + '\n\n---\nPolybius Square:\n' + squareDisplay;
}
