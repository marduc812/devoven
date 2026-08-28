// Hebrew alphabet for Hebrew Atbash (aleph=0x05D0 to tav=0x05EA, 22 letters)
const HEBREW_START = 0x05D0;
const HEBREW_END = 0x05EA;
const HEBREW_COUNT = HEBREW_END - HEBREW_START + 1; // 27, but aleph-tav is 22

// Standard Hebrew alphabet (22 letters): aleph to tav
const HEBREW_LETTERS = '\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA';

export function atbashLatin(text: string): string {
  return text.replace(/[a-zA-Z]/g, ch => {
    if (ch >= 'a' && ch <= 'z') {
      return String.fromCharCode(219 - ch.charCodeAt(0)); // 'a'(97) + 'z'(122) = 219
    }
    return String.fromCharCode(155 - ch.charCodeAt(0)); // 'A'(65) + 'Z'(90) = 155
  });
}

export function atbashHebrew(text: string): string {
  return text.replace(/[\u05D0-\u05EA]/g, ch => {
    const code = ch.charCodeAt(0);
    const idx = HEBREW_LETTERS.indexOf(ch);
    if (idx === -1) return ch; // not a standard Hebrew letter
    const mirrorIdx = HEBREW_LETTERS.length - 1 - idx;
    return HEBREW_LETTERS[mirrorIdx];
  });
}

export function atbash(text: string, includeHebrew: boolean): string {
  if (!text.trim()) return '';
  let result = atbashLatin(text);
  if (includeHebrew) {
    result = atbashHebrew(result);
  }
  return result;
}

export function getSubstitutionTable(): string {
  const plain = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cipher = plain.split('').map(ch => atbashLatin(ch)).join('');
  return 'Plain:  ' + plain + '\nCipher: ' + cipher;
}

export function processAtbash(text: string, includeHebrew: boolean): string {
  if (!text.trim()) return '';
  const result = atbash(text, includeHebrew);
  const table = getSubstitutionTable();
  return result + '\n\n---\nSubstitution alphabet (Atbash is its own inverse):\n' + table;
}
