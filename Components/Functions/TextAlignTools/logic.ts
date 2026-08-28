export function padLeft(text: string, width: number, char = ' '): string {
  return text.padStart(width, char);
}

export function padRight(text: string, width: number, char = ' '): string {
  return text.padEnd(width, char);
}

export function padCenter(text: string, width: number, char = ' '): string {
  const totalPad = Math.max(0, width - text.length);
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;
  return char.repeat(leftPad) + text + char.repeat(rightPad);
}

export function alignLines(input: string, alignment: 'left' | 'right' | 'center', width?: number): string {
  const lines = input.split('\n');
  const maxWidth = width ?? Math.max(...lines.map(l => l.length));
  return lines.map(line => {
    switch (alignment) {
      case 'left':   return padRight(line.trimEnd(), maxWidth);
      case 'right':  return padLeft(line.trimStart(), maxWidth);
      case 'center': return padCenter(line.trim(), maxWidth);
    }
  }).join('\n');
}

export function wrapText(text: string, width: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

export function columnAlign(input: string, delimiter = '\t'): string {
  const rows = input.split('\n').map(l => l.split(delimiter));
  const colWidths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i] ?? 0, cell.length);
    });
  }
  return rows.map(row =>
    row.map((cell, i) => cell.padEnd(colWidths[i] ?? cell.length)).join('  ')
  ).join('\n');
}
