export type BinaryOp = '+' | '-' | '*' | '/';

export interface StepLine {
  label: string;
  value: string;
  note?: string;
}

export interface BinaryArithResult {
  opA: string;
  opB: string;
  decA: number;
  decB: number;
  operation: BinaryOp;
  binaryResult: string;
  decResult: number | string;
  steps: StepLine[];
  error?: string;
}

function isValidBinary(s: string): boolean {
  return /^[01]+$/.test(s);
}

function pad(s: string, len: number): string {
  while (s.length < len) s = '0' + s;
  return s;
}

// Binary addition with carry steps
function binaryAdd(a: string, b: string): { result: string; steps: StepLine[] } {
  const len = Math.max(a.length, b.length) + 1;
  a = pad(a, len);
  b = pad(b, len);
  let carry = 0;
  let result = '';
  let carryRow = '';
  for (let i = len - 1; i >= 0; i--) {
    const bitA = parseInt(a[i], 10);
    const bitB = parseInt(b[i], 10);
    const sum = bitA + bitB + carry;
    result = (sum % 2).toString() + result;
    carryRow = carry.toString() + carryRow;
    carry = Math.floor(sum / 2);
  }
  // trim leading zeros but keep at least one digit
  const trimmed = result.replace(/^0+/, '') || '0';
  const steps: StepLine[] = [
    { label: 'Carries', value: carryRow.replace(/^0+/, '') || '0' },
    { label: 'A', value: a.replace(/^0+/, '') || '0' },
    { label: 'B', value: b.replace(/^0+/, '') || '0' },
    { label: 'Result', value: trimmed, note: 'Sum column by column, carry 1 when sum >= 2' },
  ];
  return { result: trimmed, steps };
}

// Binary subtraction using two's complement
function binarySub(a: string, b: string, decA: number, decB: number): { result: string; steps: StepLine[]; decResult: number } {
  const decResult = decA - decB;
  const steps: StepLine[] = [];

  // Work in a fixed width = max(a.length, b.length) + 1 to accommodate the two's complement carry
  const width = Math.max(a.length, b.length) + 1;
  const aPadded = pad(a, width);
  const bPadded = pad(b, width);

  const inverted = bPadded.split('').map(c => c === '0' ? '1' : '0').join('');
  steps.push({ label: 'B (original)', value: b });
  steps.push({ label: 'B inverted (1s complement)', value: inverted });
  const { result: twosCompRaw } = binaryAdd(inverted, '1');
  const twosComp = pad(twosCompRaw, width);
  steps.push({ label: "B's 2s complement", value: twosComp });
  steps.push({ label: 'A (padded)', value: aPadded });
  const { result: sumRaw } = binaryAdd(aPadded, twosComp);

  if (decResult < 0) {
    steps.push({ label: 'A + 2s complement(B)', value: sumRaw, note: 'Result is negative; magnitude shown below' });
    const magnitude = Math.abs(decResult);
    const magBin = magnitude.toString(2);
    steps.push({ label: 'Result (magnitude)', value: magBin, note: `= -${magnitude} in decimal` });
    return { result: '-' + magBin, steps, decResult };
  }

  // Positive result: drop the leading overflow carry bit (bit beyond `width`)
  // sumRaw may be width+1 bits; take the last `width` bits then trim leading zeros
  const trimmedSum = sumRaw.length > width ? sumRaw.slice(sumRaw.length - width) : sumRaw;
  const finalResult = (trimmedSum.replace(/^0+/, '') || '0');
  steps.push({ label: 'A + 2s complement(B) (drop carry)', value: finalResult, note: 'A - B' });
  return { result: finalResult, steps, decResult };
}

// Binary multiplication (shift and add)
function binaryMul(a: string, b: string, decA: number, decB: number): { result: string; steps: StepLine[] } {
  const steps: StepLine[] = [];
  steps.push({ label: 'A', value: a });
  steps.push({ label: 'B', value: b });
  const partials: string[] = [];
  for (let i = b.length - 1; i >= 0; i--) {
    const bit = b[i];
    const shift = b.length - 1 - i;
    if (bit === '1') {
      const partial = a + '0'.repeat(shift);
      partials.push(partial);
      steps.push({ label: `B[${b.length - 1 - i}]=1 → partial`, value: partial });
    } else {
      steps.push({ label: `B[${b.length - 1 - i}]=0 → partial`, value: '0' });
    }
  }
  const decResult = decA * decB;
  const binResult = decResult.toString(2);
  steps.push({ label: 'Result (sum of partials)', value: binResult });
  return { result: binResult, steps };
}

// Binary division (long division)
function binaryDiv(a: string, b: string, decA: number, decB: number): { result: string; steps: StepLine[] } {
  const steps: StepLine[] = [];
  steps.push({ label: 'Dividend (A)', value: a });
  steps.push({ label: 'Divisor (B)', value: b });
  const quotient = Math.trunc(decA / decB);
  const remainder = decA % decB;
  steps.push({ label: 'Quotient', value: quotient.toString(2), note: `= ${quotient} decimal` });
  steps.push({ label: 'Remainder', value: remainder.toString(2), note: `= ${remainder} decimal` });
  return { result: quotient.toString(2), steps };
}

export function computeBinaryArith(
  inputA: string,
  inputB: string,
  op: BinaryOp,
): BinaryArithResult {
  const a = inputA.trim().replace(/^0+(?=.)/, '') || '0';
  const b = inputB.trim().replace(/^0+(?=.)/, '') || '0';

  if (!isValidBinary(a)) {
    return { opA: a, opB: b, decA: 0, decB: 0, operation: op, binaryResult: '', decResult: '', steps: [], error: 'A is not a valid binary number' };
  }
  if (!isValidBinary(b)) {
    return { opA: a, opB: b, decA: 0, decB: 0, operation: op, binaryResult: '', decResult: '', steps: [], error: 'B is not a valid binary number' };
  }
  if (a.length > 32 || b.length > 32) {
    return { opA: a, opB: b, decA: 0, decB: 0, operation: op, binaryResult: '', decResult: '', steps: [], error: 'Numbers must be 32 bits or fewer' };
  }

  const decA = parseInt(a, 2);
  const decB = parseInt(b, 2);

  if (op === '/') {
    if (decB === 0) {
      return { opA: a, opB: b, decA, decB, operation: op, binaryResult: '', decResult: '', steps: [], error: 'Division by zero' };
    }
    const { result, steps } = binaryDiv(a, b, decA, decB);
    return { opA: a, opB: b, decA, decB, operation: op, binaryResult: result, decResult: Math.trunc(decA / decB), steps };
  }
  if (op === '+') {
    const { result, steps } = binaryAdd(a, b);
    return { opA: a, opB: b, decA, decB, operation: op, binaryResult: result, decResult: decA + decB, steps };
  }
  if (op === '-') {
    const { result, steps, decResult } = binarySub(a, b, decA, decB);
    return { opA: a, opB: b, decA, decB, operation: op, binaryResult: result, decResult, steps };
  }
  // multiply
  const { result, steps } = binaryMul(a, b, decA, decB);
  return { opA: a, opB: b, decA, decB, operation: op, binaryResult: result, decResult: decA * decB, steps };
}
