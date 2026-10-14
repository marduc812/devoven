import { bruteForceRot47, MAX_ROTATION_INPUT } from '@/Components/Functions/RotationTools/logic';
import { rot47 } from '@/Components/Functions/EncodingTools/logic';
import { OPERATION_MAP } from '@/lib/blocks/registry';
import { getFinalOutput, runPipeline } from '@/lib/blocks/pipeline';
import { DEFAULT_CIPHER_ALPHABET } from '@/Components/Functions/SubstitutionCipherTools/logic';
import type { BlockState } from '@/lib/blocks/types';

describe('ROT47 brute force', () => {
  it('lists every shift with the standard ROT47 result at shift 47', () => {
    const text = 'Hello! 123 ~ é😀';
    const rows = bruteForceRot47(text).split('\n');
    expect(rows).toHaveLength(94);
    expect(rows[0]).toBe(`Shift  0: ${text}`);
    expect(rows[47]).toBe(`Shift 47: ${rot47(text)}`);
    expect(new Set(rows.map((row) => row.slice(10))).size).toBe(94);
  });
  it('wraps at the ASCII boundaries without changing whitespace', () => {
    expect(bruteForceRot47('!~\t\n').split('\n').slice(0, 4)).toEqual(['Shift  0: !~\t', '', 'Shift  1: "!\t', '']);
  });
  it('bounds expansion and handles empty input', () => {
    expect(bruteForceRot47('')).toBe('');
    expect(bruteForceRot47('a'.repeat(MAX_ROTATION_INPUT)).length).toBeLessThan(1_000_000);
    expect(() => bruteForceRot47('a'.repeat(MAX_ROTATION_INPUT + 1))).toThrow('at most 10,000');
  });
});

function block(operationId: string, params: Record<string, string> = {}): BlockState {
  return { id: operationId, operationId, params, enabled: true };
}

describe('new cipher and analysis Blocks operations', () => {
  it('round trips A1Z26 through a pipeline', () => {
    expect(getFinalOutput({ input: 'HELLO WORLD', blocks: [block('a1z26-encode'), block('a1z26-decode')] })).toBe('HELLO WORLD');
  });
  it('links substitution text from upstream and decrypts it', () => {
    expect(getFinalOutput({ input: 'Hello!', blocks: [
      block('substitution-encrypt', { alphabet: DEFAULT_CIPHER_ALPHABET }),
      block('substitution-decrypt', { alphabet: DEFAULT_CIPHER_ALPHABET }),
    ] })).toBe('Hello!');
  });
  it('reports invalid cipher input as a pipeline error', () => {
    expect(runPipeline({ input: '27', blocks: [block('a1z26-decode')] })[0].error).toContain('1 to 26');
  });
  it('registers the reports as terminal operations', () => {
    expect(OPERATION_MAP['rot47-brute-force'].terminal).toBe(true);
    expect(OPERATION_MAP['index-of-coincidence'].terminal).toBe(true);
    expect(getFinalOutput({ input: 'AA', blocks: [block('index-of-coincidence')] })).toContain('1.000000');
  });
});
