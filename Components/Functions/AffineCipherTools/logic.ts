export function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function modInverse(a: number, m: number): number {
  // Extended Euclidean algorithm
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  throw new Error('Modular inverse does not exist for a=' + String(a) + ' mod ' + String(m));
}

export function affineEncryptChar(ch: string, a: number, b: number): string {
  const code = ch.toUpperCase().charCodeAt(0) - 65;
  return String.fromCharCode(((a * code + b) % 26 + 26) % 26 + 65);
}

export function affineDecryptChar(ch: string, a: number, b: number): string {
  const aInv = modInverse(a, 26);
  const code = ch.toUpperCase().charCodeAt(0) - 65;
  return String.fromCharCode(((aInv * (code - b + 26)) % 26 + 26) % 26 + 65);
}

export function affineEncrypt(text: string, a: number, b: number): string {
  if (gcd(a, 26) !== 1) throw new Error('a=' + String(a) + ' is not coprime with 26. Valid values: 1,3,5,7,9,11,15,17,19,21,23,25');
  return text.replace(/[a-zA-Z]/g, ch => {
    const upper = affineEncryptChar(ch, a, b);
    return ch >= 'a' && ch <= 'z' ? upper.toLowerCase() : upper;
  });
}

export function affineDecrypt(text: string, a: number, b: number): string {
  if (gcd(a, 26) !== 1) throw new Error('a=' + String(a) + ' is not coprime with 26. Valid values: 1,3,5,7,9,11,15,17,19,21,23,25');
  return text.replace(/[a-zA-Z]/g, ch => {
    const upper = affineDecryptChar(ch, a, b);
    return ch >= 'a' && ch <= 'z' ? upper.toLowerCase() : upper;
  });
}

export function affineSteps(text: string, a: number, b: number, mode: 'encrypt' | 'decrypt'): string {
  if (gcd(a, 26) !== 1) return 'Error: a must be coprime with 26';
  const letters = text.replace(/[^a-zA-Z]/g, '').slice(0, 5);
  const lines: string[] = [];
  if (mode === 'encrypt') {
    lines.push('Formula: E(x) = (' + String(a) + 'x + ' + String(b) + ') mod 26');
    lines.push('');
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i];
      const x = ch.toUpperCase().charCodeAt(0) - 65;
      const y = ((a * x + b) % 26 + 26) % 26;
      const out = String.fromCharCode(y + 65);
      lines.push(ch.toUpperCase() + '(' + String(x) + ') → (' + String(a) + '×' + String(x) + '+' + String(b) + ') mod 26 = ' + String(y) + ' → ' + out);
    }
  } else {
    const aInv = modInverse(a, 26);
    lines.push('Formula: D(x) = ' + String(aInv) + '(x - ' + String(b) + ') mod 26  [a⁻¹=' + String(aInv) + ']');
    lines.push('');
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i];
      const x = ch.toUpperCase().charCodeAt(0) - 65;
      const y = ((aInv * (x - b + 26)) % 26 + 26) % 26;
      const out = String.fromCharCode(y + 65);
      lines.push(ch.toUpperCase() + '(' + String(x) + ') → ' + String(aInv) + '×(' + String(x) + '-' + String(b) + ') mod 26 = ' + String(y) + ' → ' + out);
    }
  }
  return lines.join('\n');
}

export function processAffine(text: string, a: number, b: number, mode: 'encrypt' | 'decrypt'): string {
  if (!text.trim()) return '';
  const result = mode === 'encrypt' ? affineEncrypt(text, a, b) : affineDecrypt(text, a, b);
  const steps = affineSteps(text, a, b, mode);
  return result + '\n\n---\nStep-by-step (first 5 chars):\n' + steps;
}
