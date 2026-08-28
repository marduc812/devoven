export interface BitwiseResult {
  a: number;
  b: number;
  aBin: string;
  bBin: string;
  and: number;
  or: number;
  xor: number;
  nand: number;
  nor: number;
  notA: number;
  notB: number;
  leftShiftA: number;
  rightShiftA: number;
  unsignedRightShiftA: number;
  formatted: string;
}

function parseInput(s: string): number {
  const t = s.trim();
  if (/^-?0[xX][0-9a-fA-F]+$/.test(t)) return parseInt(t, 16);
  if (/^-?0[bB][01]+$/.test(t)) return parseInt(t.replace(/^-?0[bB]/, ''), 2) * (t.startsWith('-') ? -1 : 1);
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  throw new Error(`Cannot parse "${t}" as decimal or hex number`);
}

function to32Bin(n: number): string {
  // Use unsigned 32-bit representation for display
  const unsigned = n >>> 0;
  const bits = unsigned.toString(2).padStart(32, '0');
  // Group into bytes for readability
  return [bits.slice(0, 8), bits.slice(8, 16), bits.slice(16, 24), bits.slice(24, 32)].join(' ');
}

function signed32(n: number): number {
  // Convert to signed 32-bit int
  const u = n >>> 0;
  return u >= 0x80000000 ? u - 0x100000000 : u;
}

export function computeBitwise(aStr: string, bStr: string, shiftStr: string): BitwiseResult {
  if (!aStr.trim()) throw new Error('Enter a value for A');
  if (!bStr.trim()) throw new Error('Enter a value for B');

  const a = parseInput(aStr);
  const b = parseInput(bStr);
  const shift = shiftStr.trim() ? parseInt(shiftStr.trim(), 10) : 1;

  if (isNaN(a)) throw new Error('A is not a valid number');
  if (isNaN(b)) throw new Error('B is not a valid number');
  if (isNaN(shift) || shift < 0 || shift > 31) throw new Error('Shift must be 0-31');

  const andVal = (a & b);
  const orVal = (a | b);
  const xorVal = (a ^ b);
  const nandVal = ~(a & b);
  const norVal = ~(a | b);
  const notA = ~a;
  const notB = ~b;
  const leftShiftA = (a << shift);
  const rightShiftA = (a >> shift);
  const unsignedRightShiftA = (a >>> shift);

  const lines: string[] = [
    `Input A:  ${a} (dec)  0x${(a >>> 0).toString(16).toUpperCase()}  ${to32Bin(a)}`,
    `Input B:  ${b} (dec)  0x${(b >>> 0).toString(16).toUpperCase()}  ${to32Bin(b)}`,
    `Shift:    ${shift}`,
    ``,
    `=== Bitwise Operations ===`,
    ``,
    `A AND B        ${andVal} (dec)  0x${(andVal >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(andVal)}`,
    ``,
    `A OR B         ${orVal} (dec)  0x${(orVal >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(orVal)}`,
    ``,
    `A XOR B        ${xorVal} (dec)  0x${(xorVal >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(xorVal)}`,
    ``,
    `A NAND B       ${signed32(nandVal)} (dec)  0x${(nandVal >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(nandVal)}`,
    ``,
    `A NOR B        ${signed32(norVal)} (dec)  0x${(norVal >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(norVal)}`,
    ``,
    `NOT A          ${signed32(notA)} (dec)  0x${(notA >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(notA)}`,
    ``,
    `NOT B          ${signed32(notB)} (dec)  0x${(notB >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(notB)}`,
    ``,
    `A << ${shift}        ${signed32(leftShiftA)} (dec)  0x${(leftShiftA >>> 0).toString(16).toUpperCase()}`,
    `               ${to32Bin(leftShiftA)}`,
    ``,
    `A >> ${shift}        ${signed32(rightShiftA)} (dec)  (signed right shift)`,
    `               ${to32Bin(rightShiftA)}`,
    ``,
    `A >>> ${shift}       ${unsignedRightShiftA} (dec)  (unsigned right shift)`,
    `               ${to32Bin(unsignedRightShiftA)}`,
    ``,
    `=== Two's Complement Note ===`,
    `All operations use 32-bit signed integers (two's complement).`,
    `NOT A flips all 32 bits: NOT(n) = -(n+1) for signed integers.`,
  ];

  return {
    a,
    b,
    aBin: to32Bin(a),
    bBin: to32Bin(b),
    and: andVal,
    or: orVal,
    xor: xorVal,
    nand: nandVal,
    nor: norVal,
    notA,
    notB,
    leftShiftA,
    rightShiftA,
    unsignedRightShiftA,
    formatted: lines.join('\n'),
  };
}

export function formatBitwise(aStr: string, bStr: string, shiftStr: string): string {
  return computeBitwise(aStr, bStr, shiftStr).formatted;
}
