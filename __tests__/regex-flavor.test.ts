import { convertRegex, allFlavors, getFlavorLabel } from '@/Components/Functions/RegexFlavorTools/logic';

describe('allFlavors', () => {
  it('returns 4 flavors', () => {
    expect(allFlavors()).toHaveLength(4);
  });
});

describe('getFlavorLabel', () => {
  it('returns label for javascript', () => {
    expect(getFlavorLabel('javascript')).toBe('JavaScript');
  });
  it('returns label for python', () => {
    expect(getFlavorLabel('python')).toBe('Python (re)');
  });
});

describe('convertRegex', () => {
  it('returns empty for empty pattern', () => {
    const result = convertRegex('', 'javascript', 'python');
    expect(result.converted).toBe('');
  });

  it('returns same when from===to', () => {
    const result = convertRegex('\\d+', 'javascript', 'javascript');
    expect(result.converted).toBe('\\d+');
    expect(result.notes[0]).toContain('same');
  });

  it('converts Python named group to JS', () => {
    const result = convertRegex('(?P<name>\\w+)', 'python', 'javascript');
    expect(result.converted).toContain('(?<name>');
  });

  it('converts JS named group to Python', () => {
    const result = convertRegex('(?<name>\\w+)', 'javascript', 'python');
    expect(result.converted).toContain('(?P<name>');
  });

  it('adds note for POSIX ERE not supporting named groups', () => {
    const result = convertRegex('(?<id>\\d+)', 'javascript', 'posix_ere');
    expect(result.notes.some(n => n.toLowerCase().includes('named'))).toBe(true);
  });

  it('adds note for lookahead in POSIX ERE', () => {
    const result = convertRegex('foo(?=bar)', 'javascript', 'posix_ere');
    expect(result.notes.some(n => n.includes('Lookahead'))).toBe(true);
  });

  it('converts \\A anchor from python to js', () => {
    const result = convertRegex('\\Afoo', 'python', 'javascript');
    expect(result.converted).toContain('^foo');
  });

  it('converts \\Z anchor from pcre to js', () => {
    const result = convertRegex('foo\\Z', 'pcre', 'javascript');
    expect(result.converted).toContain('foo$');
  });

  it('adds note for inline flags in JS target', () => {
    const result = convertRegex('(?i)hello', 'python', 'javascript');
    expect(result.notes.some(n => n.includes('Inline flags'))).toBe(true);
  });

  it('converts Python backreference to JS', () => {
    const result = convertRegex('(?P<n>\\w+)\\s(?P=n)', 'python', 'javascript');
    expect(result.converted).toContain('\\k<n>');
  });
});
