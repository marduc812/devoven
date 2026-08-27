import {
  textToBraille,
  formatBrailleOutput,
} from '@/Components/Functions/BrailleTools/logic';

describe('textToBraille', () => {
  it('converts lowercase a', () => {
    const cells = textToBraille('a');
    expect(cells.length).toBe(1);
    expect(cells[0].original).toBe('a');
    expect(cells[0].dots).toBe('1'); // dot 1 only
  });
  it('converts uppercase A with capital indicator', () => {
    const cells = textToBraille('A');
    expect(cells.length).toBe(2);
    expect(cells[0].isIndicator).toBe(true);
    expect(cells[0].indicatorLabel).toBe('capital');
    expect(cells[1].original).toBe('A');
  });
  it('converts digit with number indicator', () => {
    const cells = textToBraille('1');
    expect(cells.length).toBe(2);
    expect(cells[0].isIndicator).toBe(true);
    expect(cells[0].indicatorLabel).toBe('number');
    expect(cells[1].original).toBe('1');
  });
  it('converts space to empty cell', () => {
    const cells = textToBraille(' ');
    expect(cells.length).toBe(1);
    expect(cells[0].dots).toBe('(empty)');
  });
  it('handles unknown character', () => {
    const cells = textToBraille('@');
    expect(cells[0].brailleChar).toBe('?');
  });
  it('converts hello correctly', () => {
    const cells = textToBraille('hello');
    // 5 letters, no indicators
    expect(cells.length).toBe(5);
    expect(cells.map(c => c.original).join('')).toBe('hello');
  });
  it('produces unicode braille characters', () => {
    const cells = textToBraille('abc');
    for (const cell of cells) {
      const code = cell.brailleChar.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(0x2800);
      expect(code).toBeLessThanOrEqual(0x28FF);
    }
  });
  it('digits share number indicator for consecutive digits', () => {
    const cells = textToBraille('42');
    // 1 number indicator + 2 digit cells
    expect(cells.length).toBe(3);
    expect(cells[0].isIndicator).toBe(true);
  });
});

describe('formatBrailleOutput', () => {
  it('returns empty string for empty input', () => {
    expect(formatBrailleOutput('')).toBe('');
    expect(formatBrailleOutput('   ')).toBe('');
  });
  it('includes Braille Output header', () => {
    const result = formatBrailleOutput('hi');
    expect(result).toContain('Braille Output:');
  });
  it('includes cell details table', () => {
    const result = formatBrailleOutput('hi');
    expect(result).toContain('Cell Details:');
    expect(result).toContain('Char');
  });
  it('includes notes section', () => {
    const result = formatBrailleOutput('hello');
    expect(result).toContain('Notes:');
  });
});
