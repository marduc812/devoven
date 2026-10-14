export const PLAIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DEFAULT_CIPHER_ALPHABET = 'QWERTYUIOPASDFGHJKLZXCVBNM';

export function substitute(text: string, alphabet: string, mode: 'encrypt' | 'decrypt'): string {
  const trimmed = alphabet.trim();
  if (!/^[A-Za-z]{26}$/.test(trimmed) || new Set(trimmed.toUpperCase()).size !== 26) {
    throw new Error('The cipher alphabet must contain each A-Z letter exactly once.');
  }
  const cipherAlphabet = trimmed.toUpperCase();
  const source = mode === 'encrypt' ? PLAIN_ALPHABET : cipherAlphabet;
  const target = mode === 'encrypt' ? cipherAlphabet : PLAIN_ALPHABET;
  return text.replace(/[A-Za-z]/g, (letter) => {
    const result = target[source.indexOf(letter.toUpperCase())];
    return letter >= 'a' ? result.toLowerCase() : result;
  });
}
