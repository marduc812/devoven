// All functions are pure (no React, no browser APIs).
// Used by TextTools2 React components and tested directly in Jest.

// ─── 1. Line Numberer ─────────────────────────────────────────────────────────

export function addLineNumbers(text: string, startFrom: number = 1, separator: string = '. '): string {
  if (!text) return '';
  return text.split('\n').map((line, i) => `${i + startFrom}${separator}${line}`).join('\n');
}

export function removeLineNumbers(text: string): string {
  if (!text) return '';
  // Remove leading "N." or "N)" or "N:" or "N -" patterns
  return text.split('\n').map(line => line.replace(/^\s*\d+[\.\)\:\-]\s*/, '')).join('\n');
}

// ─── 2. Indent / Dedent ───────────────────────────────────────────────────────

export function indentText(text: string, spaces: number): string {
  if (!text) return '';
  const prefix = ' '.repeat(spaces);
  return text.split('\n').map(line => line ? prefix + line : line).join('\n');
}

export function dedentText(text: string): string {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return text;
  const minIndent = Math.min(...lines.map(l => l.match(/^(\s*)/)?.[1].length ?? 0));
  return text.split('\n').map(line => line.slice(minIndent)).join('\n');
}

export function convertIndent(text: string, fromSize: number, toSize: number): string {
  if (!text) return '';
  return text.split('\n').map(line => {
    let indent = 0;
    let i = 0;
    while (i < line.length) {
      if (line[i] === '\t') { indent += fromSize; i++; }
      else if (line[i] === ' ') { indent++; i++; }
      else break;
    }
    const levels = Math.floor(indent / fromSize);
    return ' '.repeat(levels * toSize) + line.slice(i);
  }).join('\n');
}

// ─── 3. Column Extractor ──────────────────────────────────────────────────────

export function extractColumns(text: string, delimiter: string, columns: number[]): string {
  if (!text.trim()) return '';
  return text.split('\n').map(line => {
    if (!line.trim()) return '';
    const parts = delimiter === '\t' ? line.split('\t') :
                  delimiter === ' ' ? line.trim().split(/\s+/) :
                  line.split(delimiter);
    return columns.map(col => parts[col - 1] ?? '').join(delimiter === '\t' ? '\t' : delimiter === ' ' ? ' ' : delimiter);
  }).filter(l => l !== '').join('\n');
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  if ((firstLine.match(/\t/g) ?? []).length > 1) return '\t';
  if ((firstLine.match(/,/g) ?? []).length > 1) return ',';
  if ((firstLine.match(/;/g) ?? []).length > 1) return ';';
  if ((firstLine.match(/\|/g) ?? []).length > 1) return '|';
  return ' ';
}

// ─── 4. Text Truncator ────────────────────────────────────────────────────────

export function truncateByChars(text: string, limit: number, ellipsis: string = '...'): string {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit - ellipsis.length).trimEnd() + ellipsis;
}

export function truncateByWords(text: string, limit: number, ellipsis: string = '...'): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + ellipsis;
}

export function truncateByLines(text: string, limit: number, ellipsis: string = '...'): string {
  if (!text) return '';
  const lines = text.split('\n');
  if (lines.length <= limit) return text;
  return lines.slice(0, limit).join('\n') + '\n' + ellipsis;
}

// ─── 6. Emoji Remover ─────────────────────────────────────────────────────────

// Unicode emoji regex — covers most emoji ranges
const EMOJI_REGEX = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA9F}]/gu;

export function removeEmojis(text: string): string {
  return text.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

export function extractEmojis(text: string): string {
  return [...text.matchAll(EMOJI_REGEX)].map(m => m[0]).join(' ');
}

// ─── 7. Word Wrap ─────────────────────────────────────────────────────────────

export function wrapText(text: string, width: number): string {
  if (!text || width < 1) return text;
  return text.split('\n').map(line => {
    if (line.length <= width) return line;
    const words = line.split(' ');
    const wrapped: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && (current + ' ' + word).length > width) {
        wrapped.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) wrapped.push(current);
    return wrapped.join('\n');
  }).join('\n');
}

export function unwrapText(text: string): string {
  if (!text) return '';
  // Join lines that don't end with punctuation or blank lines
  return text.replace(/([^\n])\n(?=[^\n])/g, '$1 ').replace(/\n{2,}/g, '\n\n');
}
