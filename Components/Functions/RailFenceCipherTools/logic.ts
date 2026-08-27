export function railFenceEncode(text: string, rails: number): string {
  if (rails < 2) throw new Error('Rails must be at least 2');
  if (text.length === 0) return '';
  if (rails >= text.length) return text;

  const fence: string[][] = [];
  for (let i = 0; i < rails; i++) fence.push([]);

  let rail = 0;
  let direction = 1;
  for (let i = 0; i < text.length; i++) {
    fence[rail].push(text[i]);
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }

  return fence.map(r => r.join('')).join('');
}

export function railFenceDecode(text: string, rails: number): string {
  if (rails < 2) throw new Error('Rails must be at least 2');
  if (text.length === 0) return '';
  if (rails >= text.length) return text;

  const n = text.length;
  const pattern: number[] = new Array(n);
  let rail = 0;
  let direction = 1;
  for (let i = 0; i < n; i++) {
    pattern[i] = rail;
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }

  const lengths: number[] = new Array(rails).fill(0);
  for (let i = 0; i < n; i++) lengths[pattern[i]]++;

  const starts: number[] = new Array(rails).fill(0);
  for (let i = 1; i < rails; i++) starts[i] = starts[i - 1] + lengths[i - 1];

  const indices: number[] = new Array(rails).fill(0);
  const result: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = pattern[i];
    result[i] = text[starts[r] + indices[r]];
    indices[r]++;
  }

  return result.join('');
}

export function railFenceAsciiArt(text: string, rails: number): string {
  if (rails < 2 || text.length === 0) return '';
  const n = Math.min(text.length, 40); // cap display
  const display = text.slice(0, n);
  const grid: string[][] = [];
  for (let i = 0; i < rails; i++) {
    grid.push(new Array(n).fill(' '));
  }

  let rail = 0;
  let direction = 1;
  for (let i = 0; i < n; i++) {
    grid[rail][i] = display[i];
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }

  return grid.map(row => row.join('')).join('\n');
}

export function processRailFence(text: string, rails: number, mode: 'encode' | 'decode'): string {
  if (!text.trim()) return '';
  const result = mode === 'encode' ? railFenceEncode(text, rails) : railFenceDecode(text, rails);
  const artInput = mode === 'encode' ? text : result;
  const art = railFenceAsciiArt(artInput, rails);
  return result + '\n\n---\nZigzag pattern (' + String(rails) + ' rails):\n' + art;
}
