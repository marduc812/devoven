import {
  parseDimensions,
  simplifyRatio,
  findCommonName,
  generateBreakpointTable,
  findMissingDimension,
  formatAspectRatioCalc,
} from '@/Components/Functions/AspectRatioCalcTools/logic';

describe('parseDimensions', () => {
  it('parses 1920x1080', () => expect(parseDimensions('1920x1080')).toEqual({ width: 1920, height: 1080 }));
  it('parses 1920 1080', () => expect(parseDimensions('1920 1080')).toEqual({ width: 1920, height: 1080 }));
  it('parses 16:9', () => expect(parseDimensions('16:9')).toEqual({ width: 16, height: 9 }));
  it('throws on invalid', () => expect(() => parseDimensions('abc')).toThrow());
  it('throws on zero', () => expect(() => parseDimensions('0x0')).toThrow());
});

describe('simplifyRatio', () => {
  it('1920x1080 → 16:9', () => expect(simplifyRatio(1920, 1080)).toEqual({ rw: 16, rh: 9 }));
  it('800x600 → 4:3', () => expect(simplifyRatio(800, 600)).toEqual({ rw: 4, rh: 3 }));
  it('1280x720 → 16:9', () => expect(simplifyRatio(1280, 720)).toEqual({ rw: 16, rh: 9 }));
});

describe('findCommonName', () => {
  it('16:9 name', () => expect(findCommonName(16, 9)).toContain('HD Widescreen'));
  it('4:3 name', () => expect(findCommonName(4, 3)).toContain('Standard'));
  it('unknown ratio', () => expect(findCommonName(7, 5)).toBeNull());
});

describe('generateBreakpointTable', () => {
  it('has header', () => expect(generateBreakpointTable(16, 9)).toContain('Width'));
  it('contains 1920', () => expect(generateBreakpointTable(16, 9)).toContain('1920'));
  it('16:9 at 1920 → 1080', () => expect(generateBreakpointTable(16, 9)).toContain('1080'));
});

describe('findMissingDimension', () => {
  it('given width 1920 for 16:9 → height 1080', () => {
    expect(findMissingDimension('width', 1920, 16, 9)).toContain('height=1080');
  });
  it('given height 1080 for 16:9 → width 1920', () => {
    expect(findMissingDimension('height', 1080, 16, 9)).toContain('width=1920');
  });
});

describe('formatAspectRatioCalc', () => {
  it('full output for 1920x1080', () => {
    const r = formatAspectRatioCalc('1920x1080');
    expect(r).toContain('16:9');
    expect(r).toContain('HD Widescreen');
    expect(r).toContain('Equivalent Sizes');
    expect(r).toContain('Missing Dimension');
  });
  it('throws on invalid', () => expect(() => formatAspectRatioCalc('foo')).toThrow());
});
