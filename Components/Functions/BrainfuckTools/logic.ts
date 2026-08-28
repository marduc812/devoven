export function interpretBrainfuck(code: string, input = '', maxSteps = 100000): string {
  const tape = new Uint8Array(30000);
  let dp = 0; // data pointer
  let ip = 0; // instruction pointer
  let inputPos = 0;
  let steps = 0;
  const output: string[] = [];

  // Pre-compute bracket matches for efficiency
  const bracketMap = new Map<number, number>();
  const stack: number[] = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '[') stack.push(i);
    else if (code[i] === ']') {
      if (stack.length === 0) throw new Error(`Unmatched ] at position ${i}`);
      const open = stack.pop()!;
      bracketMap.set(open, i);
      bracketMap.set(i, open);
    }
  }
  if (stack.length > 0) throw new Error('Unmatched [');

  while (ip < code.length) {
    if (++steps > maxSteps) throw new Error(`Execution limit exceeded (${maxSteps} steps)`);
    switch (code[ip]) {
      case '>': dp = (dp + 1) % 30000; break;
      case '<': dp = (dp + 29999) % 30000; break;
      case '+': tape[dp] = (tape[dp] + 1) & 0xFF; break;
      case '-': tape[dp] = (tape[dp] + 255) & 0xFF; break;
      case '.': output.push(String.fromCharCode(tape[dp])); break;
      case ',': tape[dp] = inputPos < input.length ? input.charCodeAt(inputPos++) : 0; break;
      case '[': if (tape[dp] === 0) ip = bracketMap.get(ip)!; break;
      case ']': if (tape[dp] !== 0) ip = bracketMap.get(ip)!; break;
    }
    ip++;
  }
  return output.join('');
}
