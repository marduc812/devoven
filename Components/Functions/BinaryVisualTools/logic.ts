// Pure TypeScript — no browser APIs.

export type CharBinary = {
  char: string;
  code: number;
  binary: string;
  bits: boolean[]; // 8 bits, index 0 = MSB
};

/** Convert a single character code to an 8-bit binary string */
export function charToBinary(code: number): string {
  return (code & 0xFF).toString(2).padStart(8, '0');
}

/** Convert text to an array of CharBinary descriptors */
export function textToCharBinaries(text: string): CharBinary[] {
  const result: CharBinary[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const binary = charToBinary(code);
    const bits = binary.split('').map(b => b === '1');
    result.push({ char: text[i], code, binary, bits });
  }
  return result;
}

/** Format text as binary grid (text view output) */
export function textToBinaryOutput(text: string): string {
  if (!text) return '';
  const items = textToCharBinaries(text);
  const lines: string[] = ['Char  Dec  Binary    Hex'];
  lines.push('─'.repeat(30));
  for (const item of items) {
    const displayChar = item.code < 32 ? `[${item.code}]` : item.char;
    const hex = item.code.toString(16).toUpperCase().padStart(2, '0');
    lines.push(
      displayChar.padEnd(6) +
      String(item.code).padStart(3).padEnd(5) +
      item.binary.padEnd(10) +
      '0x' + hex
    );
  }
  lines.push('');
  lines.push('Binary stream:');
  lines.push(items.map(i => i.binary).join(' '));
  return lines.join('\n');
}

/** Detect if input looks like binary (only 0, 1, spaces) */
export function looksLikeBinary(input: string): boolean {
  const trimmed = input.trim();
  return /^[01\s]+$/.test(trimmed) && trimmed.length > 0;
}

/** Parse binary string (space-separated or continuous 8-bit groups) back to text */
export function binaryToText(binary: string): string {
  const trimmed = binary.trim();
  // Split on whitespace first
  let groups: string[];
  if (/\s/.test(trimmed)) {
    groups = trimmed.split(/\s+/).filter(Boolean);
  } else {
    // Split into 8-bit groups
    groups = [];
    for (let i = 0; i < trimmed.length; i += 8) {
      groups.push(trimmed.slice(i, i + 8));
    }
  }

  const chars: string[] = [];
  for (const group of groups) {
    if (!/^[01]{1,8}$/.test(group)) {
      return 'Error: invalid binary group "' + group + '" — each group must be 1-8 binary digits';
    }
    const code = parseInt(group, 2);
    chars.push(String.fromCharCode(code));
  }
  return chars.join('');
}

/** Auto-detect direction and convert */
export function autoConvert(input: string): { direction: 'encode' | 'decode'; output: string } {
  const trimmed = input.trim();
  if (!trimmed) return { direction: 'encode', output: '' };

  if (looksLikeBinary(trimmed)) {
    const text = binaryToText(trimmed);
    return { direction: 'decode', output: text };
  }

  return { direction: 'encode', output: textToBinaryOutput(trimmed) };
}
