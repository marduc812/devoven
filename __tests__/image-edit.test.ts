import {
  FLIP_DEFAULT,
  INVERT_DEFAULT,
  NEUTRAL,
  buildFilter,
  buildInvertFilter,
  clampPercent,
  describeAdjustments,
  describeFlip,
  describeInvert,
  editedName,
  flipTransform,
  formatBytes,
  isNeutral,
  outputFormatFor,
  parseAdjustments,
  parseFlipAxes,
  parseInvertAmount,
  ratio,
  serializeFlipAxes,
} from '@/Components/Functions/ImageEditTools/logic';

const query = (search: string) => new URLSearchParams(search);

describe('outputFormatFor', () => {
  it('keeps the formats a canvas can encode', () => {
    expect(outputFormatFor('image/jpeg')).toBe('jpeg');
    expect(outputFormatFor('image/jpg')).toBe('jpeg');
    expect(outputFormatFor('image/webp')).toBe('webp');
    expect(outputFormatFor('image/png')).toBe('png');
  });

  it('falls back to PNG for everything a canvas cannot write back', () => {
    expect(outputFormatFor('image/gif')).toBe('png');
    expect(outputFormatFor('image/avif')).toBe('png');
    expect(outputFormatFor('image/svg+xml')).toBe('png');
    expect(outputFormatFor('')).toBe('png');
  });

  it('ignores case and codec parameters', () => {
    expect(outputFormatFor('IMAGE/JPEG')).toBe('jpeg');
    expect(outputFormatFor('image/webp; charset=binary')).toBe('webp');
  });
});

describe('editedName', () => {
  it('replaces the extension with the one actually written', () => {
    expect(editedName('beach.jpg', 'adjusted', 'jpeg')).toBe('beach-adjusted.jpg');
    expect(editedName('cat.gif', 'inverted', 'png')).toBe('cat-inverted.png');
    expect(editedName('logo.PNG', 'flipped', 'png')).toBe('logo-flipped.png');
  });

  it('handles names with dots and names with none', () => {
    expect(editedName('my.holiday.photo.webp', 'flipped', 'webp')).toBe('my.holiday.photo-flipped.webp');
    expect(editedName('screenshot', 'adjusted', 'png')).toBe('screenshot-adjusted.png');
  });

  it('never produces a nameless file', () => {
    expect(editedName('.jpg', 'adjusted', 'jpeg')).toBe('image-adjusted.jpg');
  });
});

describe('clampPercent and ratio', () => {
  it('clamps to the slider range and rounds', () => {
    expect(clampPercent(-40)).toBe(0);
    expect(clampPercent(500)).toBe(200);
    expect(clampPercent(107.6)).toBe(108);
    expect(clampPercent(120, 100)).toBe(100);
  });

  it('treats a non-number as neutral rather than throwing', () => {
    expect(clampPercent(Number.NaN)).toBe(100);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(100);
  });

  it('writes a filter ratio without trailing zeros', () => {
    expect(ratio(100)).toBe('1');
    expect(ratio(110)).toBe('1.1');
    expect(ratio(105)).toBe('1.05');
    expect(ratio(0)).toBe('0');
  });
});

describe('buildFilter', () => {
  it('is empty when nothing has moved', () => {
    expect(buildFilter(NEUTRAL)).toBe('');
    expect(isNeutral(NEUTRAL)).toBe(true);
  });

  it('leaves out the terms still sitting at 100%', () => {
    expect(buildFilter({ brightness: 120, contrast: 100, saturation: 100 })).toBe('brightness(1.2)');
    expect(buildFilter({ brightness: 100, contrast: 100, saturation: 0 })).toBe('saturate(0)');
  });

  it('emits brightness, contrast and saturation in that order', () => {
    expect(buildFilter({ brightness: 90, contrast: 130, saturation: 45 })).toBe(
      'brightness(0.9) contrast(1.3) saturate(0.45)',
    );
  });
});

describe('describeAdjustments', () => {
  it('signs each change against the original', () => {
    expect(describeAdjustments({ brightness: 110, contrast: 100, saturation: 75 })).toBe(
      'brightness +10% · saturation -25%',
    );
  });

  it('says so when there is nothing to describe', () => {
    expect(describeAdjustments(NEUTRAL)).toBe('unchanged');
  });
});

describe('parseAdjustments', () => {
  it('reads the three sliders out of a share link', () => {
    expect(parseAdjustments(query('brightness=115&contrast=90&saturation=140'))).toEqual({
      brightness: 115,
      contrast: 90,
      saturation: 140,
    });
  });

  it('falls back to neutral for missing or unreadable values', () => {
    expect(parseAdjustments(query(''))).toEqual(NEUTRAL);
    expect(parseAdjustments(query('brightness=lots&contrast='))).toEqual(NEUTRAL);
  });

  it('clamps a value someone typed into the URL by hand', () => {
    expect(parseAdjustments(query('brightness=9000&saturation=-5')).brightness).toBe(200);
    expect(parseAdjustments(query('saturation=-5')).saturation).toBe(0);
  });
});

describe('invert', () => {
  it('builds the filter and drops it at zero', () => {
    expect(buildInvertFilter(100)).toBe('invert(1)');
    expect(buildInvertFilter(35)).toBe('invert(0.35)');
    expect(buildInvertFilter(0)).toBe('');
  });

  it('never inverts past full', () => {
    expect(buildInvertFilter(400)).toBe('invert(1)');
  });

  it('describes the amount', () => {
    expect(describeInvert(100)).toBe('fully inverted');
    expect(describeInvert(60)).toBe('60% inverted');
    expect(describeInvert(0)).toBe('unchanged');
  });

  it('defaults to a full inversion when the URL says nothing', () => {
    expect(parseInvertAmount(query(''))).toBe(INVERT_DEFAULT);
    expect(parseInvertAmount(query('amount=70'))).toBe(70);
    expect(parseInvertAmount(query('amount=nope'))).toBe(INVERT_DEFAULT);
  });
});

describe('flip', () => {
  it('turns axes into canvas scale factors', () => {
    expect(flipTransform({ horizontal: true, vertical: false })).toEqual({ scaleX: -1, scaleY: 1 });
    expect(flipTransform({ horizontal: false, vertical: true })).toEqual({ scaleX: 1, scaleY: -1 });
    expect(flipTransform({ horizontal: true, vertical: true })).toEqual({ scaleX: -1, scaleY: -1 });
    expect(flipTransform({ horizontal: false, vertical: false })).toEqual({ scaleX: 1, scaleY: 1 });
  });

  it('describes each combination', () => {
    expect(describeFlip({ horizontal: true, vertical: false })).toBe('flipped left to right');
    expect(describeFlip({ horizontal: false, vertical: true })).toBe('flipped top to bottom');
    expect(describeFlip({ horizontal: true, vertical: true })).toBe('flipped both ways');
    expect(describeFlip({ horizontal: false, vertical: false })).toBe('unchanged');
  });

  it('round-trips through the share link', () => {
    const cases = [
      { horizontal: true, vertical: false },
      { horizontal: false, vertical: true },
      { horizontal: true, vertical: true },
      { horizontal: false, vertical: false },
    ];
    for (const axes of cases) {
      expect(parseFlipAxes(query(`axis=${serializeFlipAxes(axes)}`))).toEqual(axes);
    }
  });

  it('accepts the long spellings and defaults to horizontal', () => {
    expect(parseFlipAxes(query('axis=horizontal'))).toEqual({ horizontal: true, vertical: false });
    expect(parseFlipAxes(query('axis=VERTICAL'))).toEqual({ horizontal: false, vertical: true });
    expect(parseFlipAxes(query(''))).toEqual(FLIP_DEFAULT);
    expect(parseFlipAxes(query('axis=sideways'))).toEqual({ horizontal: false, vertical: false });
  });
});

describe('formatBytes', () => {
  it('scales the unit to the size', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});
