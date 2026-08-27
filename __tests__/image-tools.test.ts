import {
  getScaledDimensions,
  clampQuality,
  getMimeType,
  validateBase64DataUri,
  parseDataUri,
  formatFileSize,
  getCropParams,
  getRotationDegrees,
  buildIcoHeader,
} from '@/Components/Functions/ImageTools/logic';

// ─── getScaledDimensions ──────────────────────────────────────────────────────

describe('getScaledDimensions', () => {
  it('scales down maintaining aspect ratio (landscape)', () => {
    expect(getScaledDimensions(1920, 1080, 800, 600, true)).toEqual({ w: 800, h: 450 });
  });
  it('scales down maintaining aspect ratio (portrait, height-bound)', () => {
    expect(getScaledDimensions(1080, 1920, 800, 600, true)).toEqual({ w: 338, h: 600 });
  });
  it('does not upscale when source is smaller than target', () => {
    expect(getScaledDimensions(400, 300, 800, 600, true)).toEqual({ w: 400, h: 300 });
  });
  it('free resize without maintaining aspect ratio', () => {
    expect(getScaledDimensions(1920, 1080, 800, 600, false)).toEqual({ w: 800, h: 600 });
  });
  it('returns {w:0, h:0} for zero-width source', () => {
    expect(getScaledDimensions(0, 1080, 800, 600, true)).toEqual({ w: 0, h: 0 });
  });
  it('returns {w:0, h:0} for zero-height source', () => {
    expect(getScaledDimensions(1920, 0, 800, 600, true)).toEqual({ w: 0, h: 0 });
  });
  it('scales a square image without distortion', () => {
    expect(getScaledDimensions(1000, 1000, 400, 400, true)).toEqual({ w: 400, h: 400 });
  });
});

// ─── clampQuality ─────────────────────────────────────────────────────────────

describe('clampQuality', () => {
  it('maps 100 to 1.0', () => {
    expect(clampQuality(100)).toBe(1.0);
  });
  it('maps 0 to 0.01 (not 0, to avoid blank output)', () => {
    expect(clampQuality(0)).toBe(0.01);
  });
  it('maps 50 to 0.50', () => {
    expect(clampQuality(50)).toBe(0.5);
  });
  it('clamps values above 100 to 1.0', () => {
    expect(clampQuality(150)).toBe(1.0);
  });
  it('clamps negative values to 0.01', () => {
    expect(clampQuality(-10)).toBe(0.01);
  });
  it('maps 92 correctly (default JPG quality)', () => {
    expect(clampQuality(92)).toBeCloseTo(0.92, 5);
  });
});

// ─── getMimeType ──────────────────────────────────────────────────────────────

describe('getMimeType', () => {
  it('returns image/jpeg for jpg', () => {
    expect(getMimeType('jpg')).toBe('image/jpeg');
  });
  it('returns image/png for png', () => {
    expect(getMimeType('png')).toBe('image/png');
  });
  it('returns image/webp for webp', () => {
    expect(getMimeType('webp')).toBe('image/webp');
  });
});

// ─── validateBase64DataUri ────────────────────────────────────────────────────

describe('validateBase64DataUri', () => {
  it('returns true for a valid PNG data URI', () => {
    expect(validateBase64DataUri('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });
  it('returns true for a valid JPEG data URI', () => {
    expect(validateBase64DataUri('data:image/jpeg;base64,/9j/4AAQ==')).toBe(true);
  });
  it('returns true for a valid WebP data URI', () => {
    expect(validateBase64DataUri('data:image/webp;base64,UklGRg==')).toBe(true);
  });
  it('returns false for empty string', () => {
    expect(validateBase64DataUri('')).toBe(false);
  });
  it('returns false for non-image data URI', () => {
    expect(validateBase64DataUri('data:text/plain;base64,SGVsbG8=')).toBe(false);
  });
  it('returns false for a plain string', () => {
    expect(validateBase64DataUri('not-a-data-uri')).toBe(false);
  });
  it('returns false for data URI missing base64 marker', () => {
    expect(validateBase64DataUri('data:image/png,iVBORw0KGgo=')).toBe(false);
  });
});

// ─── parseDataUri ─────────────────────────────────────────────────────────────

describe('parseDataUri', () => {
  it('parses a PNG data URI correctly', () => {
    const result = parseDataUri('data:image/png;base64,iVBORw0KGgo=');
    expect(result.mimeType).toBe('image/png');
    expect(result.data).toBe('iVBORw0KGgo=');
  });
  it('parses a JPEG data URI correctly', () => {
    const result = parseDataUri('data:image/jpeg;base64,/9j/4AAQ==');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.data).toBe('/9j/4AAQ==');
  });
  it('throws on invalid data URI', () => {
    expect(() => parseDataUri('not-a-uri')).toThrow('Invalid data URI');
  });
  it('throws on empty string', () => {
    expect(() => parseDataUri('')).toThrow('Invalid data URI');
  });
});

// ─── formatFileSize ───────────────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
  it('formats bytes under 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });
  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB');
  });
  it('formats megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });
  it('formats gigabytes', () => {
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
  });
  it('throws for negative bytes', () => {
    expect(() => formatFileSize(-1)).toThrow();
  });
});

// ─── getCropParams ────────────────────────────────────────────────────────────

describe('getCropParams', () => {
  it('returns crop params unchanged when within bounds', () => {
    expect(getCropParams(800, 600, 10, 20, 200, 150)).toEqual({
      sx: 10, sy: 20, sw: 200, sh: 150,
    });
  });
  it('clamps x to image bounds and throws when resulting crop has zero area', () => {
    // x=900 clamped to imgW=800, sw = min(100, 800-800) = 0 → throws
    expect(() => getCropParams(800, 600, 900, 0, 100, 100)).toThrow('zero area');
  });
  it('throws when crop region has zero area (x at image right edge)', () => {
    expect(() => getCropParams(800, 600, 800, 0, 100, 100)).toThrow('zero area');
  });
  it('throws when crop region has zero width', () => {
    expect(() => getCropParams(800, 600, 0, 0, 0, 100)).toThrow('zero area');
  });
  it('throws when crop region has zero height', () => {
    expect(() => getCropParams(800, 600, 0, 0, 100, 0)).toThrow('zero area');
  });
  it('clamps w to image width minus x', () => {
    const result = getCropParams(800, 600, 700, 0, 200, 100);
    expect(result.sw).toBe(100); // 800 - 700 = 100
  });
  it('origin 0,0 with full dimensions returns full image', () => {
    expect(getCropParams(800, 600, 0, 0, 800, 600)).toEqual({
      sx: 0, sy: 0, sw: 800, sh: 600,
    });
  });
});

// ─── getRotationDegrees ───────────────────────────────────────────────────────

describe('getRotationDegrees', () => {
  it('cw90 returns 90', () => {
    expect(getRotationDegrees('cw90')).toBe(90);
  });
  it('ccw90 returns -90', () => {
    expect(getRotationDegrees('ccw90')).toBe(-90);
  });
  it('180 returns 180', () => {
    expect(getRotationDegrees('180')).toBe(180);
  });
  it('flipH returns 0 (flip is handled by canvas scale)', () => {
    expect(getRotationDegrees('flipH')).toBe(0);
  });
  it('flipV returns 0 (flip is handled by canvas scale)', () => {
    expect(getRotationDegrees('flipV')).toBe(0);
  });
});

// ─── buildIcoHeader ───────────────────────────────────────────────────────────

describe('buildIcoHeader', () => {
  it('returns correct total byte length for 3 sizes', () => {
    const buf = buildIcoHeader([{ size: 16 }, { size: 32 }, { size: 48 }]);
    // 6 (ICONDIR) + 16 * 3 (ICONDIRENTRY) = 54
    expect(buf.length).toBe(54);
  });
  it('returns correct byte length for 1 size', () => {
    const buf = buildIcoHeader([{ size: 16 }]);
    expect(buf.length).toBe(22); // 6 + 16
  });
  it('ICONDIR type field is 1 (ICO)', () => {
    const buf = buildIcoHeader([{ size: 16 }]);
    const view = new DataView(buf.buffer);
    expect(view.getUint16(2, true)).toBe(1);
  });
  it('ICONDIR reserved field is 0', () => {
    const buf = buildIcoHeader([{ size: 16 }]);
    const view = new DataView(buf.buffer);
    expect(view.getUint16(0, true)).toBe(0);
  });
  it('ICONDIR count field matches number of entries', () => {
    const buf = buildIcoHeader([{ size: 16 }, { size: 32 }, { size: 48 }]);
    const view = new DataView(buf.buffer);
    expect(view.getUint16(4, true)).toBe(3);
  });
  it('first entry width byte is 16', () => {
    const buf = buildIcoHeader([{ size: 16 }, { size: 32 }]);
    expect(buf[6]).toBe(16);
  });
  it('second entry width byte is 32', () => {
    const buf = buildIcoHeader([{ size: 16 }, { size: 32 }]);
    expect(buf[6 + 16]).toBe(32);
  });
  it('size 256 encodes as 0 per ICO spec', () => {
    const buf = buildIcoHeader([{ size: 256 }]);
    expect(buf[6]).toBe(0);
  });
});
