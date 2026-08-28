import {
  generatePortmanteaux,
  formatPortmanteauOutput,
  syllabify,
  cutPoints,
  makeBlend,
  generateBlends,
  analyzePortmanteau,
  FAMOUS_BLENDS,
} from '@/Components/Functions/PortmanteauTools/logic';

describe('generatePortmanteaux', () => {
  it('returns an array of candidates', () => {
    const result = generatePortmanteaux('smoke', 'fog');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('finds overlap-based blend for smoke+fog', () => {
    // smoke ends in 'o', fog starts in... no direct overlap, but midpoint blend should work
    const result = generatePortmanteaux('smoke', 'fog');
    expect(result.length).toBeGreaterThan(0);
    // Each candidate has result, fromWord1, fromWord2, description
    expect(result[0]).toHaveProperty('result');
    expect(result[0]).toHaveProperty('fromWord1');
    expect(result[0]).toHaveProperty('fromWord2');
    expect(result[0]).toHaveProperty('description');
  });

  it('returns empty for empty words', () => {
    expect(generatePortmanteaux('', 'fog')).toHaveLength(0);
    expect(generatePortmanteaux('smoke', '')).toHaveLength(0);
  });

  it('returns no more than 6 candidates', () => {
    const result = generatePortmanteaux('breakfast', 'lunch');
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('all results are unique', () => {
    const result = generatePortmanteaux('motor', 'hotel');
    const resultWords = result.map(c => c.result.toLowerCase());
    const unique = new Set(resultWords);
    expect(unique.size).toBe(resultWords.length);
  });

  it('detects overlap for "brunch" case (break+lunch -> overlap "ch" in branch)', () => {
    // "br-ea-k" and "l-u-nch": no direct overlap, but midpoint should produce something
    const result = generatePortmanteaux('break', 'lunch');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatPortmanteauOutput', () => {
  it('returns prompt for empty input', () => {
    expect(formatPortmanteauOutput('')).toContain('two words');
  });

  it('returns instruction for single word', () => {
    expect(formatPortmanteauOutput('smoke')).toContain('two words');
  });

  it('shows candidates for two words', () => {
    const out = formatPortmanteauOutput('smoke fog');
    expect(out).toContain('candidate');
  });

  it('shows word info for valid input', () => {
    const out = formatPortmanteauOutput('motor hotel');
    expect(out).toContain('MOTOR');
    expect(out).toContain('HOTEL');
    expect(out).toContain('syllable');
  });

  it('includes famous examples section', () => {
    const out = formatPortmanteauOutput('smoke fog');
    expect(out).toContain('smog');
  });
});

// ─── Structured analysis (what the UI renders) ───────────────────────────────

const syllableText = (word: string) => syllabify(word).map(s => s.text).join('|');
const onsetRime = (word: string) => syllabify(word).map(s => `${s.onset}-${s.rime}`).join(' ');

describe('syllabify', () => {
  it('returns nothing for an empty word', () => {
    expect(syllabify('')).toEqual([]);
    expect(syllabify('!!!')).toEqual([]);
  });

  it('treats a final silent e as part of the preceding syllable', () => {
    expect(syllableText('smoke')).toBe('smoke');
    expect(onsetRime('smoke')).toBe('sm-oke');
  });

  it('gives consonant + le its own syllable', () => {
    expect(syllableText('table')).toBe('ta|ble');
    expect(syllableText('little')).toBe('lit|tle');
  });

  it('splits a cluster so the second syllable gets a legal onset', () => {
    expect(syllableText('breakfast')).toBe('break|fast');
    expect(syllableText('monster')).toBe('mon|ster');
    expect(syllableText('recorder')).toBe('re|cor|der');
  });

  it('hands a lone consonant to the following syllable', () => {
    expect(syllableText('motor')).toBe('mo|tor');
    expect(syllableText('camera')).toBe('ca|me|ra');
  });

  it('treats y as a vowel unless it opens the word', () => {
    expect(syllabify('rhythm')).toHaveLength(1);
    expect(onsetRime('rhythm')).toBe('rh-ythm');
    expect(syllabify('yellow')[0].onset).toBe('y');
  });

  it('handles a word with no vowel at all', () => {
    const sylls = syllabify('hmm');
    expect(sylls).toHaveLength(1);
    expect(sylls[0].rime).toBe('');
    expect(sylls[0].onset).toBe('hmm');
  });

  it('covers the whole word with no gaps', () => {
    for (const word of ['smoke', 'breakfast', 'situation', 'etiquette', 'biology']) {
      expect(syllableText(word).replace(/\|/g, '')).toBe(word);
    }
  });
});

describe('cutPoints', () => {
  it('marks both word edges and the onset boundary', () => {
    expect(cutPoints('smoke')).toEqual([
      { index: 0, kind: 'syllable' },
      { index: 2, kind: 'onset' },
      { index: 5, kind: 'edge' },
    ]);
  });

  it('marks a syllable boundary distinctly from an onset boundary', () => {
    const points = cutPoints('breakfast');
    expect(points.find(p => p.index === 5)).toEqual({ index: 5, kind: 'syllable' });
    expect(points.find(p => p.index === 2)).toEqual({ index: 2, kind: 'onset' });
  });

  it('is sorted and never runs past the word', () => {
    const points = cutPoints('recorder');
    expect(points.map(p => p.index)).toEqual([...points.map(p => p.index)].sort((a, b) => a - b));
    expect(points[points.length - 1].index).toBe('recorder'.length);
  });
});

describe('makeBlend', () => {
  it('splices a prefix onto a rime', () => {
    const blend = makeBlend('smoke', 'fog', 2, 1);
    expect(blend.result).toBe('smog');
    expect(blend.head).toBe('sm');
    expect(blend.tail).toBe('og');
    expect(blend.kind).toBe('splice');
    expect(blend.issues).toEqual([]);
  });

  it('keeps the front of the second word in clip mode', () => {
    const blend = makeBlend('situation', 'comedy', 3, 3, false, 'start');
    expect(blend.result).toBe('sitcom');
    expect(blend.tail).toBe('com');
    expect(blend.kind).toBe('clip');
    expect(blend.issues).toEqual([]);
  });

  it('flags letters that belong to both words as an overlap', () => {
    const blend = makeBlend('sex', 'exercise', 3, 2);
    expect(blend.result).toBe('sexercise');
    expect(blend.shared).toBe('ex');
    expect(blend.kind).toBe('overlap');
  });

  it('rejects an unpronounceable seam', () => {
    // "sm" is a legal onset, "smf" is not.
    expect(makeBlend('smoke', 'fog', 2, 1).issues).toEqual([]);
    expect(makeBlend('smoke', 'fog', 2, 0).issues).toContain('unpronounceable cluster “smf”');
  });

  it('rejects plain concatenation', () => {
    expect(makeBlend('smoke', 'fog', 5, 0).issues).toContain('the two words simply concatenated');
  });

  it('rejects a blend longer than the words it blends', () => {
    expect(makeBlend('modulator', 'demodulator', 7, 4).issues).toContain(
      'longer than the words it blends'
    );
  });

  it('rejects a sliver too small to recognise', () => {
    expect(makeBlend('web', 'log', 1, 0).issues[0]).toContain('too little of');
  });

  it('scores a clean cut above a mangled one', () => {
    expect(makeBlend('smoke', 'fog', 2, 1).score).toBeGreaterThan(
      makeBlend('smoke', 'fog', 4, 2).score
    );
  });

  it('describes where each cut fell', () => {
    expect(makeBlend('smoke', 'fog', 2, 1).notes).toEqual([
      'the onset “sm” of “smoke”',
      'the rime “og” of “fog”',
    ]);
  });

  it('clamps cuts that fall outside the word', () => {
    const blend = makeBlend('smoke', 'fog', 99, -4);
    expect(blend.headCut).toBe(5);
    expect(blend.tailCut).toBe(0);
  });
});

describe('generateBlends', () => {
  it('finds the blend English actually settled on', () => {
    const found = (a: string, b: string) => generateBlends(a, b).map(x => x.result);
    expect(found('smoke', 'fog')).toContain('smog');
    expect(found('spoon', 'fork')).toContain('spork');
    expect(found('breakfast', 'lunch')).toContain('brunch');
    expect(found('motor', 'hotel')).toContain('motel');
    expect(found('camera', 'recorder')).toContain('camcorder');
    expect(found('friend', 'enemy')).toContain('frenemy');
    expect(found('situation', 'comedy')).toContain('sitcom');
  });

  it('ranks smog and spork first for their pairs', () => {
    // The two cases where a single cut is clearly the intended one.
    expect(generateBlends('smoke', 'fog')[0].result).toBe('smog');
    expect(generateBlends('spoon', 'fork')[0].result).toBe('spork');
  });

  it('reaches most of the well-known blends', () => {
    const hits = FAMOUS_BLENDS.filter(f =>
      generateBlends(f.word1, f.word2).some(x => x.result === f.blend)
    );
    // Spelling-based cuts cannot reach pixel or malware; the rest should hold.
    expect(hits.length).toBeGreaterThanOrEqual(11);
  });

  it('returns both orderings, marked', () => {
    const blends = generateBlends('smoke', 'fog');
    expect(blends.some(x => !x.reversed)).toBe(true);
    expect(blends.some(x => x.reversed)).toBe(true);
    for (const x of blends) {
      expect(x.reversed ? [x.first, x.second] : [x.second, x.first]).toEqual(['fog', 'smoke']);
    }
  });

  it('emits no duplicates and no rejected blends', () => {
    const blends = generateBlends('camera', 'recorder');
    expect(new Set(blends.map(x => x.result)).size).toBe(blends.length);
    for (const x of blends) expect(x.issues).toEqual([]);
  });

  it('is sorted by score, best first', () => {
    const scores = generateBlends('motor', 'hotel').map(x => x.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('needs two real words', () => {
    expect(generateBlends('a', 'fog')).toEqual([]);
    expect(generateBlends('', '')).toEqual([]);
  });

  it('ignores case and punctuation', () => {
    expect(generateBlends('Smoke!', ' fog ').map(x => x.result)).toContain('smog');
  });
});

describe('analyzePortmanteau', () => {
  it('reports an error rather than throwing on empty input', () => {
    const result = analyzePortmanteau('', '');
    expect(result.error).toBeTruthy();
    expect(result.blends).toEqual([]);
    expect(result.best).toBeNull();
  });

  it('rejects a one-letter word', () => {
    expect(analyzePortmanteau('a', 'fog').error).toBe('Both words need at least two letters.');
  });

  it('returns the syllables and cuts the UI draws', () => {
    const result = analyzePortmanteau('smoke', 'fog');
    expect(result.word1).toBe('smoke');
    expect(result.syllables1).toHaveLength(1);
    expect(result.cuts2.map(p => p.index)).toEqual([0, 1, 3]);
    expect(result.best?.result).toBe('smog');
    expect(result.error).toBeNull();
  });
});
