/**
 * International Morse code (ITU-R M.1677-1), plus the punctuation and the few
 * non-English accented letters that are in common use.
 */
export const MORSE: Record<string, string> = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
  '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--', '/':'-..-.', '(':'-.--.', ')':'-.--.-', '&':'.-...', ':':'---...', ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-', '"':'.-..-.', '$':'...-..-', '@':'.--.-.',
  'Ä':'.-.-', 'Á':'.--.-', 'Å':'.--.-', 'É':'..-..', 'Ñ':'--.--', 'Ö':'---.', 'Ü':'..--',
};

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  // Reversed in insertion order, so the first spelling of a shared code wins:
  // Á and Å are both .--.- and A-acute is the commoner decode.
  Object.entries(MORSE).reverse().map(([k, v]) => [v, k])
);

/**
 * Procedural signals. They are sent as one run of dots and dashes with no
 * letter gap, which is why SOS is ...---... and not ... --- ...
 */
export const PROSIGNS: { code: string; name: string; meaning: string }[] = [
  { code: '...---...', name: 'SOS', meaning: 'Distress call. One unbroken signal, not three letters.' },
  { code: '-.-', name: 'K', meaning: 'Go ahead, over to you.' },
  { code: '.-.-.', name: 'AR', meaning: 'End of message.' },
  { code: '...-.-', name: 'SK', meaning: 'End of contact.' },
  { code: '-...-', name: 'BT', meaning: 'New paragraph or section break.' },
  { code: '........', name: 'HH', meaning: 'Error. Disregard the last word and start it again.' },
  { code: '-.-.-', name: 'KA', meaning: 'Attention, a message follows.' },
];

/** Letters, digits and punctuation split out for the reference chart. */
export const MORSE_GROUPS = {
  letters: Object.keys(MORSE).filter(c => /^[A-Z]$/.test(c)),
  digits: Object.keys(MORSE).filter(c => /^[0-9]$/.test(c)),
  punctuation: Object.keys(MORSE).filter(c => !/^[A-Z0-9]$/.test(c) && !/[ÄÁÅÉÑÖÜ]/.test(c)),
  accented: Object.keys(MORSE).filter(c => /[ÄÁÅÉÑÖÜ]/.test(c)),
};

export function textToMorse(text: string): string {
  // Trimmed first, or padding round the message turns into leading and
  // trailing word breaks that decode back as blank words.
  return text
    .trim()
    .toUpperCase()
    .split(/(\s+)/)
    .map(chunk => {
      if (/^\s+$/.test(chunk)) return '/';
      return chunk.split('').map(ch => MORSE[ch] ?? '?').join(' ');
    })
    .filter(part => part !== '')
    .join(' ');
}

/**
 * Accepts the separators people actually paste. Words may be divided by `/`,
 * `|` or a run of three or more spaces; letters by a single space. Dots may be
 * written as `.` or `·`, dashes as `-`, `_` or `–`.
 */
export function morseToText(morse: string): string {
  const normalised = morse
    .replace(/[·•]/g, '.')
    .replace(/[_–—]/g, '-')
    .trim();

  if (normalised === '') return '';

  return normalised
    .split(/\s*[/|]\s*|\s{3,}/)
    .map(word =>
      word
        .trim()
        .split(/\s+/)
        .filter(code => code !== '')
        .map(code => REVERSE_MORSE[code] ?? '?')
        .join('')
    )
    .filter(word => word !== '')
    .join(' ');
}

/**
 * Timing for one Morse string, in milliseconds, at the given words per minute.
 *
 * WPM is measured against the word PARIS, which is exactly 50 units long, so a
 * unit lasts 1200/WPM ms. A dot is 1 unit, a dash 3; the gap inside a letter is
 * 1, between letters 3, and between words 7.
 */
export type ToneSpan = { on: boolean; ms: number };

export function morseToTimeline(morse: string, wpm: number): ToneSpan[] {
  const unit = 1200 / Math.max(1, wpm);
  const spans: ToneSpan[] = [];

  const words = morse.trim().split(/\s*[/|]\s*|\s{3,}/).filter(w => w.trim() !== '');

  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) spans.push({ on: false, ms: unit * 7 });

    const letters = word.trim().split(/\s+/).filter(l => l !== '');
    letters.forEach((letter, letterIndex) => {
      if (letterIndex > 0) spans.push({ on: false, ms: unit * 3 });

      letter.split('').forEach((symbol, symbolIndex) => {
        if (symbolIndex > 0) spans.push({ on: false, ms: unit });
        if (symbol === '.') spans.push({ on: true, ms: unit });
        else if (symbol === '-') spans.push({ on: true, ms: unit * 3 });
      });
    });
  });

  return spans;
}

/** Total play time of a Morse string at a given speed, in seconds. */
export function morseDuration(morse: string, wpm: number): number {
  return morseToTimeline(morse, wpm).reduce((total, span) => total + span.ms, 0) / 1000;
}
