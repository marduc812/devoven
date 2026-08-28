import { testRegex, buildFlags, type RegexFlags } from '@/Components/Functions/RegexTesterTools/logic';

const defaultFlags: RegexFlags = { global: true, ignoreCase: false, multiline: false, dotAll: false };

describe('buildFlags', () => {
  it('returns empty string for no flags', () => {
    expect(buildFlags({ global: false, ignoreCase: false, multiline: false, dotAll: false })).toBe('');
  });

  it('returns g for global', () => {
    expect(buildFlags({ global: true, ignoreCase: false, multiline: false, dotAll: false })).toBe('g');
  });

  it('returns all flags combined', () => {
    const result = buildFlags({ global: true, ignoreCase: true, multiline: true, dotAll: true });
    expect(result).toBe('gims');
  });
});

describe('testRegex', () => {
  it('returns empty matches for empty pattern', () => {
    const r = testRegex('', 'hello world', defaultFlags);
    expect(r.isValid).toBe(true);
    expect(r.matches.length).toBe(0);
  });

  it('returns empty matches for empty test string', () => {
    const r = testRegex('\\w+', '', defaultFlags);
    expect(r.matches.length).toBe(0);
  });

  it('finds simple matches (global)', () => {
    const r = testRegex('\\w+', 'hello world', defaultFlags);
    expect(r.isValid).toBe(true);
    expect(r.matchCount).toBe(2);
    expect(r.matches[0].match).toBe('hello');
    expect(r.matches[1].match).toBe('world');
  });

  it('finds single match (non-global)', () => {
    const r = testRegex('\\w+', 'hello world', { ...defaultFlags, global: false });
    expect(r.matchCount).toBe(1);
    expect(r.matches[0].match).toBe('hello');
  });

  it('respects ignoreCase flag', () => {
    const r = testRegex('HELLO', 'hello', { ...defaultFlags, ignoreCase: true });
    expect(r.matchCount).toBe(1);
  });

  it('does NOT match with ignoreCase false', () => {
    const r = testRegex('HELLO', 'hello', { ...defaultFlags, ignoreCase: false });
    expect(r.matchCount).toBe(0);
  });

  it('returns isValid false for invalid regex', () => {
    const r = testRegex('[invalid', 'test', defaultFlags);
    expect(r.isValid).toBe(false);
    expect(r.error).not.toBeNull();
    expect(r.matchCount).toBe(0);
  });

  it('returns match positions', () => {
    const r = testRegex('world', 'hello world', defaultFlags);
    expect(r.matches[0].index).toBe(6);
    expect(r.matches[0].endIndex).toBe(11);
  });

  it('captures groups', () => {
    const r = testRegex('(\\w+)@(\\w+)', 'user@example', defaultFlags);
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches[0].captureGroups[0]).toBe('user');
    expect(r.matches[0].captureGroups[1]).toBe('example');
  });

  it('handles named capture groups', () => {
    const r = testRegex('(?<first>\\w+)\\s(?<second>\\w+)', 'hello world', { ...defaultFlags, global: false });
    expect(r.matches[0].groups).toBeDefined();
    expect(r.matches[0].groups!['first']).toBe('hello');
    expect(r.matches[0].groups!['second']).toBe('world');
  });

  it('multiline flag affects ^ and $', () => {
    const text = 'line1\nline2\nline3';
    const withMultiline = testRegex('^line\\d', text, { ...defaultFlags, multiline: true });
    expect(withMultiline.matchCount).toBe(3);
    const withoutMultiline = testRegex('^line\\d', text, { ...defaultFlags, multiline: false });
    expect(withoutMultiline.matchCount).toBe(1);
  });
});
