// Build CRC32 lookup table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
})();

export function crc32(str: string): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    crc = CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0); // unsigned 32-bit
}

export function formatCrc32(input: string): string {
  const value = crc32(input);
  const hex = value.toString(16).toUpperCase().padStart(8, '0');
  return [
    `CRC32:       0x${hex}`,
    `Decimal:     ${value}`,
    `Hex:         ${hex}`,
    `Input bytes: ${new TextEncoder ? new TextEncoder().encode(input).length : input.length}`,
  ].join('\n');
}
