function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  cleaned = cleaned.replace(/^y/, '');
  const m = cleaned.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function splitAtSyllable(word: string, syllableIndex: number): number {
  // Returns character index after `syllableIndex` syllables
  const w = word.toLowerCase();
  let syllableCount = 0;
  let inVowelGroup = false;
  const VOWELS = 'aeiouy';

  for (let i = 0; i < w.length; i++) {
    const isVowel = VOWELS.indexOf(w[i]) !== -1;
    if (isVowel && !inVowelGroup) {
      inVowelGroup = true;
      syllableCount++;
      if (syllableCount > syllableIndex) {
        // Return the position after this syllable group ends
        let j = i;
        while (j < w.length && VOWELS.indexOf(w[j]) !== -1) j++;
        return j;
      }
    } else if (!isVowel) {
      inVowelGroup = false;
    }
  }
  return w.length;
}

export interface PortmanteauCandidate {
  result: string;
  fromWord1: string;
  fromWord2: string;
  description: string;
}

export function generatePortmanteaux(word1: string, word2: string): PortmanteauCandidate[] {
  const w1 = word1.toLowerCase().replace(/[^a-z]/g, '');
  const w2 = word2.toLowerCase().replace(/[^a-z]/g, '');

  if (!w1 || !w2) return [];

  const candidates: PortmanteauCandidate[] = [];
  const seen = new Set<string>();

  function addCandidate(result: string, from1: string, from2: string, desc: string): void {
    const key = result.toLowerCase();
    if (!seen.has(key) && result.length >= 3) {
      seen.add(key);
      candidates.push({ result, fromWord1: from1, fromWord2: from2, description: desc });
    }
  }

  // Strategy 1: Find overlapping suffix of w1 with prefix of w2
  for (let overlapLen = 1; overlapLen <= Math.min(w1.length - 1, w2.length - 1, 5); overlapLen++) {
    const suffix = w1.slice(-overlapLen);
    const prefix = w2.slice(0, overlapLen);
    if (suffix === prefix) {
      const result = w1 + w2.slice(overlapLen);
      addCandidate(result, w1, w2.slice(overlapLen), `Overlap blend: "${suffix}" shared between words`);
    }
    // Also try w2 suffix overlapping w1 prefix
    const suffix2 = w2.slice(-overlapLen);
    const prefix2 = w1.slice(0, overlapLen);
    if (suffix2 === prefix2) {
      const result = w1.slice(overlapLen) + w2;
      addCandidate(result, w1.slice(overlapLen), w2, `Reverse overlap: "${suffix2}" shared`);
    }
  }

  // Strategy 2: Syllable-based splits
  const syl1 = countSyllables(w1);
  const syl2 = countSyllables(w2);

  if (syl1 >= 1 && syl2 >= 1) {
    // Take first syllable(s) of w1 + remaining of w2
    for (let s = 1; s <= Math.min(syl1, 3); s++) {
      const splitPoint = splitAtSyllable(w1, s);
      if (splitPoint > 0 && splitPoint < w1.length) {
        const part1 = w1.slice(0, splitPoint);
        const part2 = w2.slice(Math.floor(w2.length * 0.3)); // take last ~70% of w2
        if (part1.length >= 2 && part2.length >= 2) {
          addCandidate(part1 + part2, part1, part2, `First ${s} syllable(s) of "${w1}" + end of "${w2}"`);
        }
      }
    }

    // Take beginning of w1 + last syllable(s) of w2
    for (let s = 1; s <= Math.min(syl2, 3); s++) {
      const splitPoint = splitAtSyllable(w2, s);
      const part1 = w1.slice(0, Math.ceil(w1.length * 0.5));
      const part2 = w2.slice(splitPoint);
      if (part1.length >= 2 && part2.length >= 2) {
        addCandidate(part1 + part2, part1, part2, `Front of "${w1}" + last part of "${w2}" (after ${s} syllable(s))`);
      }
    }
  }

  // Strategy 3: Simple midpoint cuts
  const mid1 = Math.ceil(w1.length / 2);
  const mid2 = Math.floor(w2.length / 2);

  addCandidate(
    w1.slice(0, mid1) + w2.slice(mid2),
    w1.slice(0, mid1),
    w2.slice(mid2),
    `First half of "${w1}" + second half of "${w2}"`
  );

  // 1/3 + 2/3 split
  const third1 = Math.ceil(w1.length / 3);
  const third2 = Math.floor((w2.length * 2) / 3);
  addCandidate(
    w1.slice(0, third1) + w2.slice(third2),
    w1.slice(0, third1),
    w2.slice(third2),
    `First third of "${w1}" + last third of "${w2}"`
  );

  // 2/3 + 1/3 split
  const twoThird1 = Math.ceil((w1.length * 2) / 3);
  const oneThird2 = Math.ceil(w2.length / 3);
  addCandidate(
    w1.slice(0, twoThird1) + w2.slice(oneThird2),
    w1.slice(0, twoThird1),
    w2.slice(oneThird2),
    `First two-thirds of "${w1}" + last two-thirds of "${w2}"`
  );

  // Strategy 4: Remove common ending and combine
  const commonSuffixes = ['ing', 'ed', 'er', 'ly', 'tion', 'ness', 'ment', 'al', 'ful', 'less'];
  for (const suffix of commonSuffixes) {
    if (w1.endsWith(suffix) && w1.length > suffix.length + 2) {
      const base = w1.slice(0, w1.length - suffix.length);
      addCandidate(base + w2, base, w2, `Base of "${w1}" (removing "-${suffix}") + "${w2}"`);
    }
  }

  // Return up to 6 best candidates
  return candidates.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured analysis
//
// `generatePortmanteaux` above cuts both words at fixed fractions of their
// length (½, ⅓, ⅔), which is why it never produced any of the blends the tool
// advertises: smoke+fog gave `smoog`/`smg`, breakfast+lunch gave `breaknch`.
// Real portmanteaux cut at *syllable structure* — smoke keeps its onset `sm`,
// fog keeps its rime `og`. Everything below is built on that, and is what the
// UI renders. The functions above stay exported for the existing tests.
// ─────────────────────────────────────────────────────────────────────────────

/** Clusters English allows at the start of a syllable. */
const ONSET_CLUSTERS = new Set([
  'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gh', 'gl', 'gn', 'gr',
  'kn', 'kr', 'ph', 'pl', 'pr', 'ps', 'qu', 'rh', 'sc', 'sh', 'sk', 'sl', 'sm',
  'sn', 'sp', 'sq', 'st', 'sw', 'th', 'tr', 'tw', 'wh', 'wr',
  'sch', 'scr', 'shr', 'sph', 'spl', 'spr', 'squ', 'str', 'thr',
]);

/** Clusters English allows at the end of a syllable. */
const CODA_CLUSTERS = new Set([
  'ch', 'ck', 'ct', 'ff', 'ft', 'gh', 'ld', 'lf', 'lk', 'll', 'lm', 'lp', 'lt',
  'lv', 'mp', 'nd', 'ng', 'nk', 'ns', 'nt', 'ph', 'pt', 'rb', 'rd', 'rf', 'rk',
  'rl', 'rm', 'rn', 'rp', 'rt', 'sh', 'sk', 'sp', 'ss', 'st', 'th', 'ts', 'tt',
  'zz',
  'lch', 'lds', 'lth', 'mph', 'mpt', 'nch', 'nct', 'nds', 'nth', 'rch', 'rld',
  'rst', 'rth', 'sts', 'tch',
  'ngth', 'ndth',
]);

/**
 * `y` is a consonant only when it opens a word ("yellow"); anywhere else it
 * carries the vowel ("rhythm", "day", "syzygy").
 */
function isVowelAt(word: string, i: number): boolean {
  const ch = word[i];
  if (ch === 'y') return i > 0;
  return 'aeiou'.indexOf(ch) !== -1;
}

export interface Syllable {
  /** Index of the first character of the syllable. */
  start: number;
  /** Index where the vowel begins — the onset is `[start, nucleusStart)`. */
  nucleusStart: number;
  /** Index one past the last character. */
  end: number;
  text: string;
  /** Leading consonants. May be empty ("out"). */
  onset: string;
  /** Vowel and everything after it, within this syllable. */
  rime: string;
}

/**
 * Splits a word into syllables, each with its onset/rime boundary. These two
 * boundaries per syllable are exactly the places a portmanteau is allowed to
 * cut, which is what makes the blends pronounceable.
 */
export function syllabify(word: string): Syllable[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return [];

  // Maximal runs of vowel letters.
  const groups: { start: number; end: number }[] = [];
  for (let i = 0; i < w.length; i++) {
    if (!isVowelAt(w, i)) continue;
    const last = groups[groups.length - 1];
    if (last && last.end === i) last.end = i + 1;
    else groups.push({ start: i, end: i + 1 });
  }

  if (groups.length === 0) {
    // No vowel at all ("hmm", "psst") — one syllable with an empty rime.
    return [{ start: 0, nucleusStart: w.length, end: w.length, text: w, onset: w, rime: '' }];
  }

  // A final `e` is usually silent ("smoke", "hope") and belongs to the previous
  // syllable's coda, *unless* it follows a consonant + `l` ("table", "little"),
  // where the syllabic l carries its own syllable.
  const last = groups[groups.length - 1];
  const isBareFinalE =
    w.endsWith('e') && last.start === w.length - 1 && last.end === w.length;
  const consonantLe =
    w.length > 3 && w.endsWith('e') && w[w.length - 2] === 'l' && !isVowelAt(w, w.length - 3);
  if (groups.length > 1 && isBareFinalE && !consonantLe) groups.pop();

  // Boundaries between consecutive vowel groups: hand the longest valid onset
  // cluster to the following syllable, leave the rest as the preceding coda.
  // "breakfast" -> break|fast ("kf" is no onset, "f" is), "table" -> ta|ble.
  const starts = [0];
  for (let g = 0; g + 1 < groups.length; g++) {
    const clusterStart = groups[g].end;
    const clusterEnd = groups[g + 1].start;
    const cluster = w.slice(clusterStart, clusterEnd);

    let take = 1;
    if (cluster.length === 0) {
      take = 0;
    } else {
      for (let n = Math.min(3, cluster.length); n >= 1; n--) {
        const tail = cluster.slice(cluster.length - n);
        if (n === 1 || ONSET_CLUSTERS.has(tail)) {
          take = n;
          break;
        }
      }
    }
    starts.push(clusterEnd - take);
  }

  // "little" is lit|tle, not litt|le — the syllabic l takes the consonant
  // before it even though "tl" is no legal onset. "table" already lands here
  // via the general rule, since "bl" is one.
  if (consonantLe && starts.length > 1) {
    const forced = w.length - 3;
    if (forced > starts[starts.length - 2]) starts[starts.length - 1] = forced;
  }

  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : w.length;
    const nucleusStart = Math.max(start, Math.min(groups[i].start, end));
    return {
      start,
      nucleusStart,
      end,
      text: w.slice(start, end),
      onset: w.slice(start, nucleusStart),
      rime: w.slice(nucleusStart, end),
    };
  });
}

export type CutKind = 'onset' | 'syllable' | 'edge';

export interface CutPoint {
  /** Number of characters to the left of the cut. */
  index: number;
  kind: CutKind;
}

/**
 * Every position a word can be cut at, in order. `onset` cuts fall between a
 * syllable's consonants and its vowel (sm|oke, f|og); `syllable` cuts fall on a
 * syllable boundary (break|fast); `edge` is either end of the word.
 */
export function cutPoints(word: string): CutPoint[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return [];

  const kinds = new Map<number, CutKind>();
  const put = (index: number, kind: CutKind) => {
    // A syllable boundary that is also an onset boundary is the more
    // informative label, so `onset` never overwrites `syllable`.
    if (index < 0 || index > w.length) return;
    if (!kinds.has(index) || kinds.get(index) === 'edge') kinds.set(index, kind);
  };

  put(0, 'edge');
  put(w.length, 'edge');
  for (const syl of syllabify(w)) {
    put(syl.start, 'syllable');
    if (syl.nucleusStart > syl.start) put(syl.nucleusStart, 'onset');
  }

  return Array.from(kinds.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([index, kind]) => ({ index, kind }));
}

export type BlendKind = 'overlap' | 'splice' | 'head' | 'tail' | 'clip';

/**
 * Which end of the second word survives. `end` keeps its rime and is the usual
 * shape (smoke + f|og); `start` clips its front instead (situa|tion + com|edy →
 * sitcom), which is how modem, codec and biotech are built.
 */
export type TailMode = 'end' | 'start';

export interface Blend {
  /** The blended word. */
  result: string;
  /** Characters contributed by the first word. */
  head: string;
  /** Characters contributed by the second word. */
  tail: string;
  /**
   * Letters at the seam that belong to both words — the dropped start of the
   * second word already ends the first. Empty unless `kind` is `overlap`.
   */
  shared: string;
  /** The two words in the order they were blended. */
  first: string;
  second: string;
  headCut: number;
  /** Divides kept from dropped in the second word; `tailMode` says which side is kept. */
  tailCut: number;
  tailMode: TailMode;
  /** True when the words were blended in the reverse of the entered order. */
  reversed: boolean;
  kind: BlendKind;
  /** 0–1 overall, the weighted mean of the three scores below. */
  score: number;
  /** How well the consonants either side of the join read as English. */
  seamScore: number;
  /** How far the blend is from dropping the ~45% of its letters a blend drops. */
  compressionScore: number;
  /** The smaller of the two words' surviving fractions. */
  shareScore: number;
  /** Plain-language description of where each cut fell. */
  notes: string[];
  /** Reasons this blend is not offered as a suggestion. Empty when it is. */
  issues: string[];
}

function consonantRunAtEnd(s: string): string {
  let i = s.length;
  while (i > 0 && !isVowelAt(s, i - 1)) i--;
  return s.slice(i);
}

function consonantRunAtStart(s: string): string {
  let i = 0;
  while (i < s.length && !isVowelAt(s, i)) i++;
  return s.slice(0, i);
}

function hasVowel(s: string): boolean {
  for (let i = 0; i < s.length; i++) if (isVowelAt(s, i)) return true;
  return false;
}

function clusterOk(cluster: string, set: Set<string>): boolean {
  return cluster.length <= 1 || set.has(cluster);
}

function describeCut(word: string, cut: number, side: 'head' | 'tail' | 'clip'): string {
  const sylls = syllabify(word);
  if (side === 'head' || side === 'clip') {
    if (cut >= word.length) return `all of “${word}”`;
    const onset = sylls.find(s => s.nucleusStart === cut);
    if (onset) {
      return sylls.indexOf(onset) === 0
        ? `the onset “${onset.onset}” of “${word}”`
        : `“${word}” up to the onset of syllable ${sylls.indexOf(onset) + 1}`;
    }
    const boundary = sylls.findIndex(s => s.start === cut);
    if (boundary > 0) {
      return `the first ${boundary === 1 ? 'syllable' : `${boundary} syllables`} of “${word}”`;
    }
    return `the first ${cut} letter${cut === 1 ? '' : 's'} of “${word}”`;
  }

  if (cut === 0) return `all of “${word}”`;
  const onset = sylls.find(s => s.nucleusStart === cut);
  if (onset) {
    return sylls.indexOf(onset) === 0
      ? `the rime “${onset.rime}” of “${word}”`
      : `“${word}” from the vowel of syllable ${sylls.indexOf(onset) + 1}`;
  }
  const boundary = sylls.findIndex(s => s.start === cut);
  if (boundary > 0) {
    const kept = sylls.length - boundary;
    return `the last ${kept === 1 ? 'syllable' : `${kept} syllables`} of “${word}”`;
  }
  return `the last ${word.length - cut} letter${word.length - cut === 1 ? '' : 's'} of “${word}”`;
}

/**
 * Builds the blend that cutting `first` after `headCut` and `second` before
 * `tailCut` produces, scored and annotated. Always returns a blend, even a bad
 * one — the UI lets a user drag the cuts anywhere and explains what went wrong,
 * so rejection is reported in `issues` rather than by returning null.
 */
export function makeBlend(
  first: string,
  second: string,
  headCut: number,
  tailCut: number,
  reversed = false,
  tailMode: TailMode = 'end'
): Blend {
  const w1 = first.toLowerCase().replace(/[^a-z]/g, '');
  const w2 = second.toLowerCase().replace(/[^a-z]/g, '');
  const hc = Math.max(0, Math.min(w1.length, headCut));
  const tc = Math.max(0, Math.min(w2.length, tailCut));

  const head = w1.slice(0, hc);
  const tail = tailMode === 'start' ? w2.slice(0, tc) : w2.slice(tc);
  const dropped = tailMode === 'start' ? w2.slice(tc) : w2.slice(0, tc);
  const result = head + tail;

  // The dropped start of the second word already sitting at the end of the
  // first is what makes an overlap blend: those letters do double duty.
  const shared =
    tailMode === 'end' && dropped.length > 0 && head.endsWith(dropped) ? dropped : '';

  const kind: BlendKind =
    tailMode === 'start'
      ? 'clip'
      : shared
        ? 'overlap'
        : tc === 0
          ? 'head'
          : hc === w1.length
            ? 'tail'
            : 'splice';

  // ── Seam ──
  // When the head has no vowel its consonants are not a coda at all: they merge
  // with the tail's leading consonants into a single onset. That is the whole
  // difference between "sm|og" (a word) and "sm|fog" (not one).
  const headRun = consonantRunAtEnd(head);
  const tailRun = consonantRunAtStart(tail);
  /** Set when the head has no vowel and the merged onset is not a legal one. */
  let badOnset = '';
  let seamScore: number;
  if (!hasVowel(head)) {
    const onset = head + tailRun;
    const ok = clusterOk(onset, ONSET_CLUSTERS);
    if (!ok) badOnset = onset;
    seamScore = ok ? 1 : 0.15;
  } else {
    const codaOk = clusterOk(headRun, CODA_CLUSTERS);
    const onsetOk = clusterOk(tailRun, ONSET_CLUSTERS);
    seamScore = codaOk && onsetOk ? 1 : codaOk || onsetOk ? 0.55 : 0.15;
  }
  if (shared) seamScore = Math.max(seamScore, 0.9);

  // ── Compression ──
  // The defining property: a blend is materially shorter than its two words
  // stuck together. Real ones drop a little under half — smog and motel both
  // land on exactly 0.5, brunch on 0.57, camcorder on 0.36. Scoring the
  // distance from that centre is what separates a blend from a compound
  // ("fogsmoke", 0.25) and from plain concatenation ("smokefog", 0.0).
  // There is a band rather than a single ideal: 0.36 for camcorder, 0.5 for
  // smog and motel, 0.57 for brunch, 0.6 for sitcom. The penalty is for falling
  // outside it — too little compression is a compound ("fogsmoke", 0.25) or a
  // bare concatenation ("smokefog", 0.0); too much leaves nothing to recognise.
  const total = w1.length + w2.length;
  const compression = total === 0 ? 0 : 1 - result.length / total;
  const outside = Math.max(0, 0.35 - compression, compression - 0.6);
  const compressionScore = Math.max(0, 1 - outside / 0.35);

  // ── Share ──
  // Both words have to leave enough behind to be recognised. Measured against
  // the source word, not in characters — "cam" is half of "camera" while "der"
  // is a sliver of "recorder", which is why camcorder reads as a blend and
  // "camder" does not.
  const headShare = w1.length === 0 ? 0 : head.length / w1.length;
  const tailShare = w2.length === 0 ? 0 : tail.length / w2.length;
  const shareScore = Math.min(headShare, tailShare);

  // A word that survives intact makes a compound rather than a blend. It is
  // still a legitimate portmanteau shape ("fr" + "enemy"), just a weaker one.
  const intact = kind === 'head' || kind === 'tail' ? 0.95 : 1;

  const score = Math.min(
    1,
    (seamScore * 0.4 + compressionScore * 0.35 + shareScore * 0.25) * intact
  );

  const issues: string[] = [];
  if (head.length === 0) issues.push('nothing kept from the first word');
  else if (head.length < 2) issues.push(`“${head}” is too little of “${w1}” to recognise`);
  if (tail.length === 0) issues.push('nothing kept from the second word');
  else if (tail.length < 2) issues.push(`“${tail}” is too little of “${w2}” to recognise`);
  if (result.length < 3) issues.push('too short to be a word');
  // A blend contracts its two words, so it does not come out longer than the
  // longer of them. One character of slack covers camcorder, emoticon and
  // netiquette, all of which overshoot by exactly one.
  else if (result.length > Math.max(w1.length, w2.length) + 1) {
    issues.push('longer than the words it blends');
  }
  if (result && !hasVowel(result)) issues.push('no vowel');
  if (/(.)\1\1/.test(result)) issues.push('three identical letters in a row');
  // With no vowel in the head, its consonants merge with the tail's into a
  // single onset — "sm" + "og" is a word, "sm" + "fog" needs "smf" to be one.
  if (badOnset) issues.push(`unpronounceable cluster “${badOnset}”`);
  else if (headRun.length + tailRun.length >= 5) {
    issues.push(`unpronounceable cluster “${headRun + tailRun}”`);
  }
  if (result === w1 || result === w2) issues.push('same as one of the input words');
  // Deliberately no "one edit away from an input" rule: motel is one edit from
  // hotel and netiquette one from etiquette, so it threw out real answers.
  if (hc === w1.length && (tailMode === 'end' ? tc === 0 : tc === w2.length)) {
    issues.push('the two words simply concatenated');
  }

  return {
    result,
    head,
    tail,
    shared,
    first: w1,
    second: w2,
    headCut: hc,
    tailCut: tc,
    tailMode,
    reversed,
    kind,
    score,
    seamScore,
    compressionScore,
    shareScore,
    notes: [describeCut(w1, hc, 'head'), describeCut(w2, tc, tailMode === 'start' ? 'clip' : 'tail')],
    issues,
  };
}

/**
 * Every blend of the two words worth offering, best first, in both orders.
 * Cuts are taken only at the onset and syllable boundaries of each word.
 */
export function generateBlends(word1: string, word2: string): Blend[] {
  const w1 = word1.toLowerCase().replace(/[^a-z]/g, '');
  const w2 = word2.toLowerCase().replace(/[^a-z]/g, '');
  if (w1.length < 2 || w2.length < 2) return [];

  const best = new Map<string, Blend>();

  const walk = (a: string, b: string, reversed: boolean) => {
    const heads = cutPoints(a).filter(c => c.index > 0);
    for (const h of heads) {
      for (const mode of ['end', 'start'] as TailMode[]) {
        // Keeping all of the second word is the same blend either way, so each
        // mode only walks the cuts that actually drop something.
        const tails = cutPoints(b).filter(c =>
          mode === 'end' ? c.index < b.length : c.index > 0 && c.index < b.length
        );
        for (const t of tails) {
          const blend = makeBlend(a, b, h.index, t.index, reversed, mode);
          if (blend.issues.length > 0) continue;
          const existing = best.get(blend.result);
          if (!existing || blend.score > existing.score) best.set(blend.result, blend);
        }
      }
    }
  };

  walk(w1, w2, false);
  if (w1 !== w2) walk(w2, w1, true);

  return Array.from(best.values()).sort(
    (a, b) => b.score - a.score || a.result.length - b.result.length || a.result.localeCompare(b.result)
  );
}

export interface PortmanteauResult {
  word1: string;
  word2: string;
  /** Set when the words cannot be blended at all. */
  error: string | null;
  syllables1: Syllable[];
  syllables2: Syllable[];
  cuts1: CutPoint[];
  cuts2: CutPoint[];
  /** Best blend of each direction and cut, highest score first. */
  blends: Blend[];
  best: Blend | null;
}

export function analyzePortmanteau(word1: string, word2: string): PortmanteauResult {
  const w1 = word1.toLowerCase().replace(/[^a-z]/g, '');
  const w2 = word2.toLowerCase().replace(/[^a-z]/g, '');

  const empty: PortmanteauResult = {
    word1: w1,
    word2: w2,
    error: null,
    syllables1: syllabify(w1),
    syllables2: syllabify(w2),
    cuts1: cutPoints(w1),
    cuts2: cutPoints(w2),
    blends: [],
    best: null,
  };

  if (!w1 || !w2) return { ...empty, error: 'Enter two words to blend.' };
  if (w1.length < 2 || w2.length < 2) {
    return { ...empty, error: 'Both words need at least two letters.' };
  }

  const blends = generateBlends(w1, w2);
  return { ...empty, blends, best: blends[0] ?? null };
}

/** Well-known blends, used as presets and as a reference table. */
export const FAMOUS_BLENDS: { blend: string; word1: string; word2: string }[] = [
  { blend: 'smog', word1: 'smoke', word2: 'fog' },
  { blend: 'brunch', word1: 'breakfast', word2: 'lunch' },
  { blend: 'motel', word1: 'motor', word2: 'hotel' },
  { blend: 'camcorder', word1: 'camera', word2: 'recorder' },
  { blend: 'spork', word1: 'spoon', word2: 'fork' },
  { blend: 'podcast', word1: 'pod', word2: 'broadcast' },
  { blend: 'emoticon', word1: 'emotion', word2: 'icon' },
  { blend: 'frenemy', word1: 'friend', word2: 'enemy' },
  { blend: 'sitcom', word1: 'situation', word2: 'comedy' },
  { blend: 'malware', word1: 'malicious', word2: 'software' },
  { blend: 'pixel', word1: 'picture', word2: 'element' },
  { blend: 'codec', word1: 'coder', word2: 'decoder' },
  { blend: 'modem', word1: 'modulator', word2: 'demodulator' },
  { blend: 'bionic', word1: 'biology', word2: 'electronic' },
  { blend: 'netiquette', word1: 'network', word2: 'etiquette' },
];

export function formatPortmanteauOutput(input: string): string {
  if (!input.trim()) return 'Enter two words to blend into portmanteau combinations.\nFormat: word1 word2\n\nExamples:\n  smoke fog → smog\n  break lunch → brunch\n  motor hotel → motel\n  web log → blog\n  breakfast lunch → brunch';

  const parts = input.trim().split(/\s+/);
  if (parts.length < 2) {
    return 'Enter two words separated by a space.\nExample: "smoke fog" or "motor hotel"';
  }

  const word1 = parts[0];
  const word2 = parts[parts.length > 1 ? 1 : 0];

  const w1 = word1.toLowerCase().replace(/[^a-z]/g, '');
  const w2 = word2.toLowerCase().replace(/[^a-z]/g, '');

  if (w1.length < 2 || w2.length < 2) {
    return 'Both words must be at least 2 characters long.';
  }

  const candidates = generatePortmanteaux(w1, w2);

  const lines: string[] = [];
  lines.push(`=== Portmanteau: "${w1}" + "${w2}" ===`);
  lines.push('');
  lines.push(`Word 1: ${w1.toUpperCase()} (${countSyllables(w1)} syllable(s))`);
  lines.push(`Word 2: ${w2.toUpperCase()} (${countSyllables(w2)} syllable(s))`);
  lines.push('');

  if (candidates.length === 0) {
    lines.push('No portmanteau candidates found for these words.');
    lines.push('Try longer or more dissimilar words.');
    return lines.join('\n');
  }

  lines.push(`Found ${candidates.length} portmanteau candidate(s):`);
  lines.push('');

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    lines.push(`${i + 1}. ${c.result.toUpperCase()}`);
    lines.push(`   [${c.fromWord1}] + [${c.fromWord2}]`);
    lines.push(`   ${c.description}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('Famous portmanteaux: smoke+fog=smog, break+lunch=brunch, motor+hotel=motel,');
  lines.push('web+log=blog, breakfast+lunch=brunch, camera+recorder=camcorder');

  return lines.join('\n');
}
