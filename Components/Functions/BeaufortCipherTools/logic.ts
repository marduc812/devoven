// Beaufort cipher: E(i) = (key[i] - plain[i] + 26) mod 26
// It is symmetric: encrypt === decrypt

export function beaufortProcess(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0) throw new Error('Key must contain at least one letter');
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const isUpper = ch >= 'A' && ch <= 'Z';
    const p = ch.toUpperCase().charCodeAt(0) - 65;
    const kv = k.charCodeAt(ki % k.length) - 65;
    ki++;
    const enc = (kv - p + 26) % 26;
    return isUpper ? String.fromCharCode(enc + 65) : String.fromCharCode(enc + 97);
  });
}

export function beaufortTableau(text: string, key: string): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0 || !text.trim()) return '';

  const letters = text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
  if (letters.length === 0) return '';

  const lines: string[] = [];
  lines.push('Char  Key   Key-Plain  Result');
  lines.push('----  ---   ---------  ------');

  for (let i = 0; i < letters.length; i++) {
    const p = letters.charCodeAt(i) - 65;
    const kv = k.charCodeAt(i % k.length) - 65;
    const enc = (kv - p + 26) % 26;
    const ch = letters[i];
    const kch = k[i % k.length];
    const res = String.fromCharCode(enc + 65);
    const diff = '(' + kch + '(' + String(kv) + ') - ' + ch + '(' + String(p) + ') + 26) % 26 = ' + String(enc);
    lines.push(ch + '     ' + kch + '     ' + diff + '  => ' + res);
  }

  return lines.join('\n');
}

export function processBeaufort(text: string, key: string): string {
  if (!text.trim()) return '';
  const result = beaufortProcess(text, key);
  const tableau = beaufortTableau(text, key);
  let out = result;
  if (tableau) {
    out += '\n\n---\nKey tableau (first 10 letters):\n' + tableau;
  }
  return out;
}
