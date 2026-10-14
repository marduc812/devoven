export function encodeA1Z26(text: string): string {
  return text.split(/\r?\n/).map((line) =>
    (line.match(/[A-Za-z]+/g) ?? []).map((word) =>
      Array.from(word.toUpperCase(), (letter) => String(letter.charCodeAt(0) - 64)).join('-'),
    ).join(' / '),
  ).join('\n');
}

export function decodeA1Z26(text: string): string {
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return '';
    return line.split('/').map((word) => {
      const tokens = word.trim().split(/[\s,-]+/);
      return tokens.map((token) => {
        if (!/^\d{1,2}$/.test(token) || Number(token) < 1 || Number(token) > 26) {
          throw new Error('Use numbers from 1 to 26, separated by spaces, commas or hyphens. Use / between words.');
        }
        return String.fromCharCode(64 + Number(token));
      }).join('');
    }).join(' ');
  }).join('\n');
}
