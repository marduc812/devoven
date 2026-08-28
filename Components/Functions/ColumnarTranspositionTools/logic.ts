export function columnarEncrypt(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0) throw new Error('Key must contain at least one letter');
  const cleaned = text.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 0) return '';

  const numCols = k.length;
  const numRows = Math.ceil(cleaned.length / numCols);
  const padded = cleaned.padEnd(numRows * numCols, 'X');

  // Build grid rows
  const grid: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    grid.push(padded.slice(r * numCols, (r + 1) * numCols).split(''));
  }

  // Get column order: sort by letter value (alphabetical)
  const order = getSortedOrder(k);

  let result = '';
  for (let i = 0; i < numCols; i++) {
    const col = order[i];
    for (let r = 0; r < numRows; r++) {
      result += grid[r][col];
    }
  }
  return result;
}

export function columnarDecrypt(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0) throw new Error('Key must contain at least one letter');
  const cleaned = text.toUpperCase().replace(/\s/g, '');
  if (cleaned.length === 0) return '';

  const numCols = k.length;
  const numRows = Math.ceil(cleaned.length / numCols);
  if (cleaned.length !== numRows * numCols) throw new Error('Ciphertext length must be a multiple of key length');

  const order = getSortedOrder(k);

  // Reconstruct column lengths
  const colLen = numRows;
  // Fill columns in sorted order
  const cols: string[][] = new Array(numCols).fill(null).map(() => []);
  let pos = 0;
  for (let i = 0; i < numCols; i++) {
    const col = order[i];
    for (let r = 0; r < colLen; r++) {
      cols[col][r] = cleaned[pos++];
    }
  }

  let result = '';
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      result += cols[c][r];
    }
  }
  return result.replace(/X+$/, '');
}

export function columnarGrid(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0 || text.trim().length === 0) return '';

  const cleaned = text.replace(/\s/g, '').toUpperCase();
  const numCols = k.length;
  const numRows = Math.ceil(cleaned.length / numCols);
  const padded = cleaned.padEnd(numRows * numCols, 'X');
  const order = getSortedOrder(k);

  // Header: show column numbers and sorted order
  const keyHeader = k.split('').join(' ');
  const orderHeader = order.map((_, i) => {
    const sortedIdx = order.indexOf(i);
    return String(sortedIdx + 1);
  }).join(' ');

  let lines: string[] = [];
  lines.push('Key:   ' + keyHeader);
  lines.push('Order: ' + orderHeader);
  lines.push('');

  for (let r = 0; r < numRows; r++) {
    lines.push(padded.slice(r * numCols, (r + 1) * numCols).split('').join(' '));
  }

  return lines.join('\n');
}

export function processColumnar(text: string, key: string, mode: 'encrypt' | 'decrypt'): string {
  if (!text.trim()) return '';
  const result = mode === 'encrypt' ? columnarEncrypt(text, key) : columnarDecrypt(text, key);
  const grid = mode === 'encrypt' ? columnarGrid(text, key) : '';
  let out = result;
  if (grid) {
    out += '\n\n---\nGrid visualization:\n' + grid;
  }
  return out;
}

function getSortedOrder(k: string): number[] {
  const indexed = k.split('').map((ch, i) => ({ ch, i }));
  indexed.sort((a, b) => a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i);
  return indexed.map(x => x.i);
}
