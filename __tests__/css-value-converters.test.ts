import {
  pxToRem,
  remToPx,
  convertPxToRemBatch,
  convertRemToPxBatch,
} from '../Components/Functions/CssValueConverters/logic';

// ─── pxToRem ──────────────────────────────────────────────────────────────────

describe('pxToRem', () => {
  it('converts 16px to 1rem (default base)', () => {
    expect(pxToRem(16)).toBe(1);
  });

  it('converts 8px to 0.5rem', () => {
    expect(pxToRem(8)).toBe(0.5);
  });

  it('converts 24px to 1.5rem', () => {
    expect(pxToRem(24)).toBe(1.5);
  });

  it('uses custom base font size', () => {
    expect(pxToRem(20, 20)).toBe(1);
  });

  it('converts 0px to 0rem', () => {
    expect(pxToRem(0)).toBe(0);
  });
});

// ─── remToPx ──────────────────────────────────────────────────────────────────

describe('remToPx', () => {
  it('converts 1rem to 16px (default base)', () => {
    expect(remToPx(1)).toBe(16);
  });

  it('converts 0.5rem to 8px', () => {
    expect(remToPx(0.5)).toBe(8);
  });

  it('converts 1.5rem to 24px', () => {
    expect(remToPx(1.5)).toBe(24);
  });

  it('uses custom base font size', () => {
    expect(remToPx(2, 20)).toBe(40);
  });

  it('round-trips with pxToRem', () => {
    expect(remToPx(pxToRem(32))).toBe(32);
  });
});

// ─── convertPxToRemBatch ──────────────────────────────────────────────────────

describe('convertPxToRemBatch', () => {
  it('converts a single px value', () => {
    expect(convertPxToRemBatch('16')).toBe('16px → 1rem');
  });

  it('converts px with unit suffix', () => {
    expect(convertPxToRemBatch('32px')).toBe('32px → 2rem');
  });

  it('converts multiple lines', () => {
    const result = convertPxToRemBatch('16\n8\n32');
    expect(result).toBe('16px → 1rem\n8px → 0.5rem\n32px → 2rem');
  });

  it('passes through non-matching lines', () => {
    expect(convertPxToRemBatch('hello')).toBe('hello');
  });

  it('converts with custom base', () => {
    expect(convertPxToRemBatch('20', 20)).toBe('20px → 1rem');
  });

  it('strips trailing zeros from rem value', () => {
    const result = convertPxToRemBatch('16');
    expect(result).toBe('16px → 1rem');
  });
});

// ─── convertRemToPxBatch ──────────────────────────────────────────────────────

describe('convertRemToPxBatch', () => {
  it('converts a single rem value', () => {
    expect(convertRemToPxBatch('1')).toBe('1rem → 16px');
  });

  it('converts rem with unit suffix', () => {
    expect(convertRemToPxBatch('2rem')).toBe('2rem → 32px');
  });

  it('converts multiple lines', () => {
    const result = convertRemToPxBatch('1\n0.5\n2');
    expect(result).toBe('1rem → 16px\n0.5rem → 8px\n2rem → 32px');
  });

  it('passes through non-matching lines', () => {
    expect(convertRemToPxBatch('hello')).toBe('hello');
  });

  it('converts with custom base', () => {
    expect(convertRemToPxBatch('1', 20)).toBe('1rem → 20px');
  });
});
