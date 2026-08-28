// Tap code: 5x5 Polybius square, C and K share position (K maps to C)
// Each letter is row.col, expressed as groups of dots separated by spaces

const GRID = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
];

function charToTaps(ch: string): string | null {
  const c = ch.toUpperCase() === 'K' ? 'C' : ch.toUpperCase();
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      if (GRID[r][col] === c) {
        return '.'.repeat(r + 1) + ' ' + '.'.repeat(col + 1);
      }
    }
  }
  return null;
}

function tapsToChar(row: number, col: number): string {
  if (row < 1 || row > 5 || col < 1 || col > 5) return '?';
  return GRID[row - 1][col - 1];
}

export function tapEncode(text: string): string {
  const letters = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (letters.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < letters.length; i++) {
    const taps = charToTaps(letters[i]);
    if (taps !== null) parts.push(taps);
  }
  return parts.join(' / ');
}

export function tapDecode(text: string): string {
  // Split by '/' to get letter groups
  const groups = text.split('/').map(g => g.trim()).filter(g => g.length > 0);
  if (groups.length === 0) return '';

  let result = '';
  for (let gi = 0; gi < groups.length; gi++) {
    // Each group has two parts separated by space of dots
    // Format: ".. ..." means row=2, col=3
    const parts = groups[gi].trim().split(/\s+/);
    if (parts.length !== 2) {
      result += '?';
      continue;
    }
    const row = parts[0].replace(/[^.]/g, '').length;
    const col = parts[1].replace(/[^.]/g, '').length;
    result += tapsToChar(row, col);
  }
  return result;
}

export function tapGrid(): string {
  const lines: string[] = ['Tap Code Grid (row.col):'];
  lines.push('     1    2    3    4    5');
  const rowLabels = ['1', '2', '3', '4', '5'];
  for (let r = 0; r < 5; r++) {
    const cells = GRID[r].map(ch => ch.padEnd(4)).join(' ');
    lines.push(rowLabels[r] + '    ' + cells);
  }
  lines.push('(K uses C position)');
  return lines.join('\n');
}

export function processTapCode(text: string, mode: 'encode' | 'decode'): string {
  if (!text.trim()) return '';
  const result = mode === 'encode' ? tapEncode(text) : tapDecode(text);
  const grid = tapGrid();
  return result + '\n\n---\n' + grid;
}
