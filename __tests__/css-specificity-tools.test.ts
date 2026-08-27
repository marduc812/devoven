import { calcSpecificity } from '@/Components/Functions/CssSpecificityTools/logic';

describe('calcSpecificity', () => {
  it('returns empty for empty input', () => {
    const result = calcSpecificity('');
    expect(result.selectors).toHaveLength(0);
    expect(result.error).toBeNull();
  });

  it('calculates ID specificity', () => {
    const result = calcSpecificity('#foo');
    expect(result.selectors[0].tuple.ids).toBe(1);
    expect(result.selectors[0].tuple.classes).toBe(0);
    expect(result.selectors[0].tuple.elements).toBe(0);
  });

  it('calculates class specificity', () => {
    const result = calcSpecificity('.foo');
    expect(result.selectors[0].tuple.ids).toBe(0);
    expect(result.selectors[0].tuple.classes).toBe(1);
    expect(result.selectors[0].tuple.elements).toBe(0);
  });

  it('calculates element specificity', () => {
    const result = calcSpecificity('div');
    expect(result.selectors[0].tuple.elements).toBe(1);
    expect(result.selectors[0].tuple.ids).toBe(0);
  });

  it('calculates compound specificity', () => {
    const result = calcSpecificity('#id .class div');
    const sel = result.selectors[0];
    expect(sel.tuple.ids).toBe(1);
    expect(sel.tuple.classes).toBe(1);
    expect(sel.tuple.elements).toBe(1);
  });

  it('calculates inline style specificity', () => {
    const result = calcSpecificity('inline');
    expect(result.selectors[0].tuple.inline).toBe(1);
    expect(result.selectors[0].score).toBeGreaterThan(0);
  });

  it('formats label correctly', () => {
    const result = calcSpecificity('#id');
    expect(result.selectors[0].label).toBe('(0,1,0,0)');
  });

  it('determines winner between two selectors', () => {
    const result = calcSpecificity('#id\n.class');
    expect(result.winner).toBe('A');
  });

  it('detects tie', () => {
    const result = calcSpecificity('div\nspan');
    expect(result.winner).toBe('tie');
  });

  it('calculates pseudo-class specificity', () => {
    const result = calcSpecificity('a:hover');
    expect(result.selectors[0].tuple.classes).toBeGreaterThanOrEqual(1);
    expect(result.selectors[0].tuple.elements).toBeGreaterThanOrEqual(1);
  });

  it('calculates attribute selector specificity', () => {
    const result = calcSpecificity('[type="text"]');
    expect(result.selectors[0].tuple.classes).toBeGreaterThanOrEqual(1);
  });

  it('handles multiple selectors', () => {
    const result = calcSpecificity('#id\n.foo\ndiv');
    expect(result.selectors).toHaveLength(3);
  });
});
