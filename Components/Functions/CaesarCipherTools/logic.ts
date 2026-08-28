export function caesarShift(text: string, shift: number): string {
  const n = ((shift % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch >= 'a' ? 97 : 65;
    return String.fromCharCode(((ch.charCodeAt(0) - base + n) % 26) + base);
  });
}

export function rot13(text: string): string { return caesarShift(text, 13); }

export function bruteForceCaesar(text: string): string {
  return Array.from({length: 26}, (_, i) =>
    `Shift ${String(i).padStart(2,' ')}: ${caesarShift(text, i)}`
  ).join('\n');
}
