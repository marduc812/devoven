// The converters need byte, UTF-8 and integer operations, without a Web3 validator.
export function hexToBytes(value: string): Uint8Array {
  const hex = value.replace(/^0x/i, '');
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    throw new Error('Invalid hexadecimal bytes');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function stringToHex(value: string): string {
  // Preserve the existing converter's removal of one leading and trailing NUL.
  const text = value.replace(/^\u0000/, '').replace(/\u0000$/, '');
  return '0x' + Array.from(new TextEncoder().encode(text), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToString(value: string): string {
  return new TextDecoder().decode(hexToBytes(value));
}

export function numberToHex(value: string): string {
  const number = BigInt(value);
  return number < 0n ? '-0x' + (-number).toString(16) : '0x' + number.toString(16);
}

export function hexToNumber(value: string): number | bigint {
  if (!/^-?0x[0-9a-f]+$/i.test(value)) throw new Error('Invalid hexadecimal integer');
  const number = value.startsWith('-') ? -BigInt(value.slice(1)) : BigInt(value);
  return number >= BigInt(Number.MIN_SAFE_INTEGER) && number <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(number)
    : number;
}
