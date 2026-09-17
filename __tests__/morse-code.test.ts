import {
  textToMorse,
  morseToText,
  morseToTimeline,
  morseDuration,
  MORSE,
  MORSE_GROUPS,
} from '@/Components/Functions/MorseCodeTools/logic';

describe('textToMorse', () => {
  it('encodes SOS', () => expect(textToMorse('SOS')).toBe('... --- ...'));
  it('encodes A', () => expect(textToMorse('A')).toBe('.-'));
  it('encodes lowercase', () => expect(textToMorse('a')).toBe('.-'));
  it('encodes HI THERE', () => expect(textToMorse('HI THERE')).toBe('.... .. / - .... . .-. .'));
  it('encodes digits', () => expect(textToMorse('9')).toBe('----.'));
  it('unknown char gives ?', () => expect(textToMorse('~')).toBe('?'));
  it('collapses a run of spaces into one word break', () =>
    expect(textToMorse('A   B')).toBe('.- / -...'));
  it('ignores leading and trailing whitespace', () =>
    expect(textToMorse('  A  ')).toBe('.-'));
});

describe('morseToText', () => {
  it('decodes SOS', () => expect(morseToText('... --- ...')).toBe('SOS'));
  it('decodes with word separator', () => expect(morseToText('.... .. / - .... . .-. .')).toBe('HI THERE'));
  it('unknown code gives ?', () => expect(morseToText('.......')).toBe('?'));
  it('accepts a pipe as a word break', () => expect(morseToText('.... .. | - .... . .-. .')).toBe('HI THERE'));
  it('accepts a run of spaces as a word break', () => expect(morseToText('.-    -...')).toBe('A B'));
  it('accepts middle dots and underscores', () => expect(morseToText('··· ___ ···')).toBe('SOS'));
  it('is empty for empty input', () => expect(morseToText('   ')).toBe(''));
  it('round-trips a sentence', () => expect(morseToText(textToMorse('HELLO WORLD'))).toBe('HELLO WORLD'));
});

describe('morseToTimeline', () => {
  it('gives a dot one unit and a dash three', () => {
    // 60 WPM makes a unit exactly 20ms, so the numbers read straight off.
    expect(morseToTimeline('.-', 60)).toEqual([
      { on: true, ms: 20 },
      { on: false, ms: 20 },
      { on: true, ms: 60 },
    ]);
  });

  it('puts three units between letters and seven between words', () => {
    const gaps = morseToTimeline('. / .', 60).filter(span => !span.on);
    expect(gaps).toEqual([{ on: false, ms: 140 }]);

    const letterGaps = morseToTimeline('. .', 60).filter(span => !span.on);
    expect(letterGaps).toEqual([{ on: false, ms: 60 }]);
  });

  it('is empty for empty input', () => expect(morseToTimeline('', 20)).toEqual([]));
});

describe('morseDuration', () => {
  it('measures PARIS as 50 units, one second at 20 WPM', () => {
    // PARIS plus its trailing word gap is the definition of one word; the
    // string alone is 50 units minus the 7-unit trailing gap.
    expect(morseDuration(textToMorse('PARIS'), 20)).toBeCloseTo(60 * (50 - 7) / 1000, 3);
  });
});

describe('the reference chart', () => {
  it('covers every letter and digit', () => {
    expect(MORSE_GROUPS.letters).toHaveLength(26);
    expect(MORSE_GROUPS.digits).toHaveLength(10);
  });
  it('groups every entry exactly once', () => {
    const grouped = Object.values(MORSE_GROUPS).flat();
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.sort()).toEqual(Object.keys(MORSE).sort());
  });
});
