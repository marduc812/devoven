import { estimateComplexity } from '@/Components/Functions/ComplexityTools/logic';

describe('estimateComplexity', () => {
  it('handles empty input', () => {
    const r = estimateComplexity('');
    expect(r.cyclomaticComplexity).toBe(1);
    expect(r.linesOfCode).toBeGreaterThanOrEqual(0);
  });

  it('rates simple code as low', () => {
    const code = `function hello() {\n  return "world";\n}`;
    const r = estimateComplexity(code);
    expect(r.rating).toBe('low');
    expect(r.cyclomaticComplexity).toBeLessThanOrEqual(5);
  });

  it('counts if statements', () => {
    const code = `
if (a) { x(); }
if (b) { y(); }
if (c) { z(); }
    `;
    const r = estimateComplexity(code);
    expect(r.branches.ifElse).toBe(3);
  });

  it('counts for loops', () => {
    const code = `
for (let i = 0; i < 10; i++) { }
for (const x of arr) { }
    `;
    const r = estimateComplexity(code);
    expect(r.branches.loops).toBeGreaterThanOrEqual(2);
  });

  it('counts logical operators', () => {
    const code = `if (a && b || c) { }`;
    const r = estimateComplexity(code);
    expect(r.branches.logicalOps).toBeGreaterThanOrEqual(2);
  });

  it('detects comment lines', () => {
    const code = `// this is a comment\n# another comment\ncode here`;
    const r = estimateComplexity(code);
    expect(r.commentLines).toBeGreaterThanOrEqual(2);
  });

  it('calculates nesting depth', () => {
    const code = `
function a() {
  if (x) {
    for (let i=0; i<n; i++) {
      if (y) {
        doSomething();
      }
    }
  }
}
    `;
    const r = estimateComplexity(code);
    expect(r.maxNestingDepth).toBeGreaterThanOrEqual(4);
  });

  it('rates complex code as high or very high', () => {
    // Build code with many branches
    const branches = Array.from({ length: 15 }, (_, i) =>
      `if (cond${i}) { doSomething${i}(); }`
    ).join('\n');
    const r = estimateComplexity(branches);
    expect(['high', 'very high']).toContain(r.rating);
  });

  it('formats output', () => {
    const r = estimateComplexity('if (a) { } else { }');
    expect(r.formatted).toContain('Cyclomatic Complexity');
    expect(r.formatted).toContain('Lines of Code');
    expect(r.formatted).toContain('Branch Breakdown');
  });
});
