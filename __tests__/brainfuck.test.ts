import { interpretBrainfuck } from '@/Components/Functions/BrainfuckTools/logic';

describe('interpretBrainfuck', () => {
  it('outputs Hello World', () => {
    const helloWorld = '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.';
    expect(interpretBrainfuck(helloWorld)).toBe('Hello World!\n');
  });
  it('echoes input with comma/dot', () => {
    expect(interpretBrainfuck(',+.', 'A')).toBe('B'); // A=65, +1=66=B
  });
  it('outputs empty string for no output instructions', () => {
    expect(interpretBrainfuck('+++')).toBe('');
  });
  it('throws for unmatched [', () => expect(() => interpretBrainfuck('[')).toThrow());
  it('throws for unmatched ]', () => expect(() => interpretBrainfuck(']')).toThrow());
  it('throws when step limit exceeded', () => {
    expect(() => interpretBrainfuck('+[]', '', 100)).toThrow('Execution limit exceeded');
  });
  it('handles empty program', () => expect(interpretBrainfuck('')).toBe(''));
  it('ignores non-brainfuck characters', () => expect(interpretBrainfuck('this is a comment')).toBe(''));
});
