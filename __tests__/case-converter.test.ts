import { convertAllCases, allCasesToText } from '@/Components/Functions/CaseConverterTools/logic';

describe('convertAllCases', () => {
  it('returns empty array for empty input', () => {
    expect(convertAllCases('')).toEqual([]);
    expect(convertAllCases('   ')).toEqual([]);
  });

  it('converts "hello world" to camelCase', () => {
    const results = convertAllCases('hello world');
    const camel = results.find(r => r.key === 'camel');
    expect(camel).toBeDefined();
    expect(camel!.value).toBe('helloWorld');
  });

  it('converts "hello world" to PascalCase', () => {
    const results = convertAllCases('hello world');
    const pascal = results.find(r => r.key === 'pascal');
    expect(pascal!.value).toBe('HelloWorld');
  });

  it('converts "hello world" to snake_case', () => {
    const results = convertAllCases('hello world');
    const snake = results.find(r => r.key === 'snake');
    expect(snake!.value).toBe('hello_world');
  });

  it('converts "hello world" to kebab-case', () => {
    const results = convertAllCases('hello world');
    const kebab = results.find(r => r.key === 'kebab');
    expect(kebab!.value).toBe('hello-world');
  });

  it('converts "hello world" to SCREAMING_SNAKE_CASE', () => {
    const results = convertAllCases('hello world');
    const screaming = results.find(r => r.key === 'screaming');
    expect(screaming!.value).toBe('HELLO_WORLD');
  });

  it('handles camelCase input', () => {
    const results = convertAllCases('helloWorld');
    const snake = results.find(r => r.key === 'snake');
    expect(snake!.value).toBe('hello_world');
  });

  it('handles kebab-case input', () => {
    const results = convertAllCases('hello-world-foo');
    const camel = results.find(r => r.key === 'camel');
    expect(camel!.value).toBe('helloWorldFoo');
  });

  it('handles snake_case input', () => {
    const results = convertAllCases('hello_world');
    const pascal = results.find(r => r.key === 'pascal');
    expect(pascal!.value).toBe('HelloWorld');
  });

  it('returns 13 case formats', () => {
    const results = convertAllCases('hello world');
    expect(results.length).toBe(13);
  });
});

describe('allCasesToText', () => {
  it('returns empty string for empty input', () => {
    expect(allCasesToText('')).toBe('');
  });

  it('returns formatted text with labels', () => {
    const result = allCasesToText('hello world');
    expect(result).toContain('camelCase');
    expect(result).toContain('snake_case');
    expect(result).toContain('helloWorld');
  });
});
