import {
  HEIGHT_STEP,
  MIN_EDITOR_HEIGHT,
  clampEditorHeight,
  maxEditorHeight,
} from '@/Components/Functions/TextEditorTools/editorHeight';

describe('editor height clamping', () => {
  it('keeps a height that fits the viewport', () => {
    expect(clampEditorHeight(500, 900)).toBe(500);
  });

  it('never drops below the usable minimum', () => {
    expect(clampEditorHeight(10, 900)).toBe(MIN_EDITOR_HEIGHT);
    expect(clampEditorHeight(-400, 900)).toBe(MIN_EDITOR_HEIGHT);
  });

  it('leaves room for the toolbar and counters at the top end', () => {
    expect(clampEditorHeight(5000, 900)).toBe(maxEditorHeight(900));
    expect(maxEditorHeight(900)).toBeLessThan(900);
  });

  it('gives the minimum priority on a viewport shorter than it', () => {
    expect(maxEditorHeight(200)).toBe(MIN_EDITOR_HEIGHT);
    expect(clampEditorHeight(400, 200)).toBe(MIN_EDITOR_HEIGHT);
  });

  it('rounds fractional drag positions to whole pixels', () => {
    expect(clampEditorHeight(432.6, 1200)).toBe(433);
  });

  it('falls back to the minimum for a height that is not a number', () => {
    expect(clampEditorHeight(Number.NaN, 900)).toBe(MIN_EDITOR_HEIGHT);
  });

  it('moves by a visible amount per arrow key press', () => {
    expect(clampEditorHeight(400 + HEIGHT_STEP, 900)).toBe(424);
  });
});
