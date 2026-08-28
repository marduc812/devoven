import { evaluateTemplate, parseVariables } from '@/Components/Functions/TemplateLiteralTools/logic';

describe('parseVariables', () => {
  it('parses string variables', () => {
    const vars = parseVariables('name="Alice"');
    expect(vars.name).toBe('Alice');
  });

  it('parses number variables', () => {
    const vars = parseVariables('age=25');
    expect(vars.age).toBe(25);
  });

  it('parses boolean variables', () => {
    const vars = parseVariables('active=true\ndone=false');
    expect(vars.active).toBe(true);
    expect(vars.done).toBe(false);
  });

  it('ignores comment lines', () => {
    const vars = parseVariables('# this is a comment\nname="Bob"');
    expect(vars.name).toBe('Bob');
    expect(Object.keys(vars)).toHaveLength(1);
  });

  it('ignores empty lines', () => {
    const vars = parseVariables('\n\nname="Carol"\n\n');
    expect(Object.keys(vars)).toHaveLength(1);
  });
});

describe('evaluateTemplate', () => {
  it('returns empty for empty template', () => {
    const result = evaluateTemplate('', '');
    expect(result.resolved).toBe('');
  });

  it('resolves simple variable substitution', () => {
    const result = evaluateTemplate('Hello ${name}!', 'name="World"');
    expect(result.resolved).toBe('Hello World!');
  });

  it('resolves arithmetic expressions', () => {
    const result = evaluateTemplate('${2 + 3}', '');
    expect(result.resolved).toBe('5');
  });

  it('resolves variable in expression', () => {
    const result = evaluateTemplate('${x * 2}', 'x=5');
    expect(result.resolved).toBe('10');
  });

  it('resolves ternary expression', () => {
    const result = evaluateTemplate('${age > 17 ? "adult" : "minor"}', 'age=18');
    expect(result.resolved).toBe('adult');
  });

  it('resolves string method toUpperCase', () => {
    const result = evaluateTemplate('${name.toUpperCase()}', 'name="alice"');
    expect(result.resolved).toBe('ALICE');
  });

  it('reports error for unknown variable', () => {
    const result = evaluateTemplate('${unknown}', '');
    expect(result.expressions[0].error).not.toBeNull();
  });

  it('tracks expression results', () => {
    const result = evaluateTemplate('${1+1} and ${2+2}', '');
    expect(result.expressions).toHaveLength(2);
    expect(result.expressions[0].value).toBe('2');
    expect(result.expressions[1].value).toBe('4');
  });

  it('resolves Math functions', () => {
    const result = evaluateTemplate('${Math.max(3, 7)}', '');
    expect(result.resolved).toBe('7');
  });

  it('resolves string concatenation', () => {
    const result = evaluateTemplate('${"Hello" + " " + "World"}', '');
    expect(result.resolved).toBe('Hello World');
  });

  it('resolves comparison', () => {
    const result = evaluateTemplate('${5 > 3}', '');
    expect(result.resolved).toBe('true');
  });
});
