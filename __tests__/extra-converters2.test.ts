import {
  svgToDataUri,
  svgToBase64DataUri,
  pxToEm,
  emToPx,
  pxToRem,
  pxToPt,
  ptToPx,
  pxToVw,
  pxToVh,
  convertCssUnit,
} from '../Components/Functions/ExtraConverters2/logic';

// ─── svgToDataUri ─────────────────────────────────────────────────────────────

describe('svgToDataUri', () => {
  const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

  it('returns empty string for empty input', () => expect(svgToDataUri('')).toBe(''));
  it('produces url() wrapped data URI', () => {
    const result = svgToDataUri(simpleSvg);
    expect(result.startsWith('url("data:image/svg+xml,')).toBe(true);
  });
  it('encodes < and > characters', () => {
    const result = svgToDataUri(simpleSvg);
    expect(result).toContain('%3C');
    expect(result).toContain('%3E');
  });
  it('throws on non-SVG input', () => expect(() => svgToDataUri('<div>hello</div>')).toThrow());
  it('accepts xml declaration prefix', () => {
    const xmlSvg = '<?xml version="1.0"?><svg></svg>';
    expect(() => svgToDataUri(xmlSvg)).not.toThrow();
  });
});

// ─── svgToBase64DataUri ───────────────────────────────────────────────────────

describe('svgToBase64DataUri', () => {
  const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

  it('returns empty string for empty input', () => expect(svgToBase64DataUri('')).toBe(''));
  it('produces base64 data URI', () => {
    const result = svgToBase64DataUri(simpleSvg);
    expect(result.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
  it('produces valid base64', () => {
    const result = svgToBase64DataUri(simpleSvg);
    const b64 = result.replace('data:image/svg+xml;base64,', '');
    expect(() => atob(b64)).not.toThrow();
  });
});

// ─── CSS unit helpers ─────────────────────────────────────────────────────────

describe('pxToEm', () => {
  it('converts 16px to 1em at base 16', () => expect(pxToEm(16, 16)).toBe(1));
  it('converts 32px to 2em at base 16', () => expect(pxToEm(32, 16)).toBe(2));
  it('converts 10px to 0.625em at base 16', () => expect(pxToEm(10, 16)).toBeCloseTo(0.625));
});

describe('emToPx', () => {
  it('converts 1em to 16px at base 16', () => expect(emToPx(1, 16)).toBe(16));
  it('converts 2em to 32px at base 16', () => expect(emToPx(2, 16)).toBe(32));
});

describe('pxToRem', () => {
  it('converts 16px to 1rem at root 16', () => expect(pxToRem(16, 16)).toBe(1));
  it('converts 8px to 0.5rem at root 16', () => expect(pxToRem(8, 16)).toBe(0.5));
});

describe('pxToPt', () => {
  it('converts 16px to 12pt', () => expect(pxToPt(16)).toBe(12));
  it('converts 0px to 0pt', () => expect(pxToPt(0)).toBe(0));
});

describe('ptToPx', () => {
  it('converts 12pt to 16px', () => expect(ptToPx(12)).toBeCloseTo(16));
  it('is inverse of pxToPt', () => expect(ptToPx(pxToPt(24))).toBeCloseTo(24));
});

describe('pxToVw', () => {
  it('converts 1440px to 100vw at viewport 1440', () => expect(pxToVw(1440, 1440)).toBe(100));
  it('converts 720px to 50vw at viewport 1440', () => expect(pxToVw(720, 1440)).toBe(50));
});

describe('pxToVh', () => {
  it('converts 900px to 100vh at viewport 900', () => expect(pxToVh(900, 900)).toBe(100));
  it('converts 450px to 50vh at viewport 900', () => expect(pxToVh(450, 900)).toBe(50));
});

// ─── convertCssUnit ───────────────────────────────────────────────────────────

describe('convertCssUnit', () => {
  it('converts 16px to 1em', () => expect(convertCssUnit(16, 'px', 'em')).toBe(1));
  it('converts 1rem to 16px', () => expect(convertCssUnit(1, 'rem', 'px')).toBe(16));
  it('converts 12pt to 16px', () => expect(convertCssUnit(12, 'pt', 'px')).toBeCloseTo(16));
  it('converts 100vw to 1440px', () => expect(convertCssUnit(100, 'vw', 'px')).toBe(1440));
  it('throws on unknown from unit', () => expect(() => convertCssUnit(1, 'xx', 'px')).toThrow());
  it('throws on unknown to unit', () => expect(() => convertCssUnit(1, 'px', 'xx')).toThrow());
});
