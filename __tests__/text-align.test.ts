import {
  padLeft,
  padRight,
  padCenter,
  alignLines,
  wrapText,
  columnAlign,
} from '../Components/Functions/TextAlignTools/logic';

// ─── padLeft ──────────────────────────────────────────────────────────────────

describe('padLeft', () => {
  it('pads text to the right-align within given width', () => {
    expect(padLeft('hi', 5)).toBe('   hi');
  });

  it('uses custom pad character', () => {
    expect(padLeft('hi', 5, '0')).toBe('000hi');
  });

  it('returns text unchanged when already at width', () => {
    expect(padLeft('hello', 5)).toBe('hello');
  });

  it('returns text unchanged when longer than width', () => {
    expect(padLeft('hello world', 5)).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(padLeft('', 3)).toBe('   ');
  });
});

// ─── padRight ─────────────────────────────────────────────────────────────────

describe('padRight', () => {
  it('pads text to the left-align within given width', () => {
    expect(padRight('hi', 5)).toBe('hi   ');
  });

  it('uses custom pad character', () => {
    expect(padRight('hi', 5, '-')).toBe('hi---');
  });

  it('returns text unchanged when already at width', () => {
    expect(padRight('hello', 5)).toBe('hello');
  });

  it('returns text unchanged when longer than width', () => {
    expect(padRight('hello world', 5)).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(padRight('', 3)).toBe('   ');
  });
});

// ─── padCenter ────────────────────────────────────────────────────────────────

describe('padCenter', () => {
  it('centers text within given width', () => {
    expect(padCenter('hi', 6)).toBe('  hi  ');
  });

  it('centers text with odd padding (extra space on right)', () => {
    // totalPad=3, leftPad=1, rightPad=2
    expect(padCenter('hi', 5)).toBe(' hi  ');
  });

  it('uses custom pad character', () => {
    expect(padCenter('hi', 6, '-')).toBe('--hi--');
  });

  it('returns text unchanged when already at width', () => {
    expect(padCenter('hello', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(padCenter('', 4)).toBe('    ');
  });
});

// ─── alignLines ───────────────────────────────────────────────────────────────

describe('alignLines', () => {
  it('left-aligns lines to max width', () => {
    const result = alignLines('hi\nhello', 'left');
    expect(result).toBe('hi   \nhello');
  });

  it('right-aligns lines to max width', () => {
    const result = alignLines('hi\nhello', 'right');
    expect(result).toBe('   hi\nhello');
  });

  it('center-aligns lines to max width', () => {
    const result = alignLines('hi\nhello', 'center');
    // 'hi' centered in 5 chars = ' hi  ' (leftPad=1, rightPad=2)
    expect(result.split('\n')[0]).toBe(' hi  ');
  });

  it('uses custom width when provided', () => {
    const result = alignLines('hi', 'left', 10);
    expect(result).toBe('hi        ');
  });

  it('handles single line', () => {
    expect(alignLines('hello', 'center')).toBe('hello');
  });
});

// ─── wrapText ─────────────────────────────────────────────────────────────────

describe('wrapText', () => {
  it('wraps text at specified width', () => {
    expect(wrapText('one two three four five', 10)).toBe('one two\nthree four\nfive');
  });

  it('does not wrap if text fits within width', () => {
    expect(wrapText('hello', 80)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(wrapText('', 80)).toBe('');
  });

  it('width of 1 wraps each word to its own line', () => {
    expect(wrapText('a b c', 1)).toBe('a\nb\nc');
  });

  it('handles multiple words on single wrap boundary', () => {
    const result = wrapText('hello world foo bar', 11);
    expect(result).toContain('\n');
  });
});

// ─── columnAlign ─────────────────────────────────────────────────────────────

describe('columnAlign', () => {
  it('aligns tab-delimited columns', () => {
    const input = 'name\tage\nAlice\t30\nBob\t25';
    const result = columnAlign(input);
    const lines = result.split('\n');
    // Each line should have columns aligned to the same positions
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
    expect(lines[1]).toContain('Alice');
  });

  it('uses custom delimiter', () => {
    const input = 'a,b\nc,dd';
    const result = columnAlign(input, ',');
    const lines = result.split('\n');
    expect(lines[0].length).toBe(lines[1].length);
  });

  it('handles single column input', () => {
    const result = columnAlign('foo\nbar\nbaz');
    expect(result).toBe('foo\nbar\nbaz');
  });

  it('handles empty input', () => {
    expect(columnAlign('')).toBe('');
  });

  it('pads shorter cells to match wider ones', () => {
    const input = 'hi\tworld\nhello\tx';
    const result = columnAlign(input);
    const lines = result.split('\n');
    // 'hi' should be padded to 'hello' width
    expect(lines[0].length).toBe(lines[1].length);
  });
});
