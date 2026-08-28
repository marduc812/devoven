export function vigenereEncrypt(text: string, key: string): string {
  if (!key.trim()) throw new Error('Key cannot be empty');
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0) throw new Error('Key must contain at least one letter');
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function vigenereDecrypt(text: string, key: string): string {
  if (!key.trim()) throw new Error('Key cannot be empty');
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.length === 0) throw new Error('Key must contain at least one letter');
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch >= 'a' ? 97 : 65;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}
