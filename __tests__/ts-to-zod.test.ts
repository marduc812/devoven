import { convertTsToZod } from '@/Components/Functions/TsToZodTools/logic';

describe('convertTsToZod', () => {
  it('returns empty on empty input', () => {
    expect(convertTsToZod('')).toBe('');
  });

  it('throws when no interfaces found', () => {
    expect(() => convertTsToZod('const x = 1;')).toThrow();
  });

  it('converts simple interface', () => {
    const output = convertTsToZod('interface User { name: string; age: number; }');
    expect(output).toContain('z.object');
    expect(output).toContain('name: z.string()');
    expect(output).toContain('age: z.number()');
  });

  it('handles optional fields', () => {
    const output = convertTsToZod('interface User { name: string; age?: number; }');
    expect(output).toContain('age: z.number().optional()');
  });

  it('handles boolean', () => {
    const output = convertTsToZod('interface Flags { active: boolean; }');
    expect(output).toContain('active: z.boolean()');
  });

  it('handles null', () => {
    const output = convertTsToZod('interface T { x: null; }');
    expect(output).toContain('z.null()');
  });

  it('handles string array', () => {
    const output = convertTsToZod('interface T { tags: string[]; }');
    expect(output).toContain('z.array(z.string())');
  });

  it('handles union type', () => {
    const output = convertTsToZod('interface T { status: string | number; }');
    expect(output).toContain('z.union');
  });

  it('handles nullable union', () => {
    const output = convertTsToZod('interface T { name: string | null; }');
    expect(output).toContain('.nullable()');
  });

  it('handles type alias', () => {
    const output = convertTsToZod('type Status = "active" | "inactive";');
    expect(output).toContain('StatusSchema');
    expect(output).toContain('z.literal');
  });

  it('adds import statement', () => {
    const output = convertTsToZod('interface T { x: string; }');
    expect(output).toContain("import { z } from 'zod'");
  });

  it('adds type inference export', () => {
    const output = convertTsToZod('interface User { name: string; }');
    expect(output).toContain("z.infer<typeof UserSchema>");
  });

  it('handles multiple interfaces', () => {
    const output = convertTsToZod('interface A { x: string; } interface B { y: number; }');
    expect(output).toContain('ASchema');
    expect(output).toContain('BSchema');
  });

  it('handles export interface', () => {
    const output = convertTsToZod('export interface User { name: string; }');
    expect(output).toContain('UserSchema');
  });
});
