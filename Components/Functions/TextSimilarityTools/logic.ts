function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(function(w) { return w.length > 0; });
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  setA.forEach(function(word) {
    if (setB.has(word)) intersectionSize++;
  });

  const unionSize = setA.size + setB.size - intersectionSize;
  return intersectionSize / unionSize;
}

export function cosineSimilarity(a: string, b: string): number {
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);

  if (wordsA.length === 0 && wordsB.length === 0) return 1;
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  // Build frequency vectors
  const freqA: Record<string, number> = {};
  const freqB: Record<string, number> = {};
  for (const w of wordsA) freqA[w] = (freqA[w] || 0) + 1;
  for (const w of wordsB) freqB[w] = (freqB[w] || 0) + 1;

  // All unique words
  const allWords = new Set<string>(Object.keys(freqA).concat(Object.keys(freqB)));

  let dot = 0;
  let magA = 0;
  let magB = 0;

  allWords.forEach(function(w) {
    const va = freqA[w] || 0;
    const vb = freqB[w] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Use 1D DP array
  const prev: number[] = [];
  const curr: number[] = [];
  for (let j = 0; j <= n; j++) prev.push(j);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function editDistanceSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = editDistance(a, b);
  return 1 - dist / maxLen;
}

export function lcsSimilarity(a: string, b: string): number {
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);
  const m = wordsA.length;
  const n = wordsB.length;

  if (m === 0 && n === 0) return 1;
  if (m === 0 || n === 0) return 0;

  // LCS DP
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp.push([]);
    for (let j = 0; j <= n; j++) dp[i].push(0);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[m][n];
  return (2 * lcsLength) / (m + n);
}

export function charSimilarity(a: string, b: string): number {
  // Character-level bigram similarity
  function bigrams(s: string): string[] {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) {
      out.push(s[i] + s[i + 1]);
    }
    return out;
  }

  const ba = bigrams(a.toLowerCase());
  const bb = bigrams(b.toLowerCase());

  if (ba.length === 0 && bb.length === 0) return 1;
  if (ba.length === 0 || bb.length === 0) return 0;

  const setA = new Set(ba);
  const setB = new Set(bb);
  let intersection = 0;
  setA.forEach(function(bg) {
    if (setB.has(bg)) intersection++;
  });

  return (2 * intersection) / (setA.size + setB.size);
}

export interface SimilarityResult {
  jaccard: number;
  cosine: number;
  editDistSimilarity: number;
  lcsSimilarity: number;
  charSimilarity: number;
  overallEstimate: number;
}

export function computeSimilarity(text1: string, text2: string): SimilarityResult {
  const j = jaccardSimilarity(text1, text2);
  const c = cosineSimilarity(text1, text2);
  const e = editDistanceSimilarity(text1, text2);
  const l = lcsSimilarity(text1, text2);
  const ch = charSimilarity(text1, text2);
  const overall = (j + c + e + l + ch) / 5;
  return {
    jaccard: j,
    cosine: c,
    editDistSimilarity: e,
    lcsSimilarity: l,
    charSimilarity: ch,
    overallEstimate: overall,
  };
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export function formatSimilarityOutput(input: string): string {
  if (!input.trim()) return 'Enter two text blocks separated by\n---\non its own line.';

  const parts = input.split(/^---$/m);
  if (parts.length < 2) {
    return 'Separate the two texts with "---" on its own line.\n\nExample:\nThe quick brown fox\n---\nThe fast brown dog';
  }

  const text1 = parts[0].trim();
  const text2 = parts.slice(1).join('---').trim();

  if (!text1 || !text2) return 'Both text blocks must be non-empty.';

  return formatSimilarityPair(text1, text2);
}

/** The report for two texts that are already separated (the Blocks builder hands them over as two fields). */
export function formatSimilarityPair(text1: string, text2: string): string {
  const r = computeSimilarity(text1, text2);

  const lines: string[] = [];
  lines.push('=== Text Similarity Analysis ===');
  lines.push('');
  lines.push(`Text 1: ${text1.length} chars, ${tokenize(text1).length} words`);
  lines.push(`Text 2: ${text2.length} chars, ${tokenize(text2).length} words`);
  lines.push('');
  lines.push('=== Similarity Scores ===');
  lines.push('');
  lines.push(`Jaccard Similarity:        ${pct(r.jaccard)}`);
  lines.push('  → Word set overlap. Best for: detecting duplicate/paraphrased content.');
  lines.push('');
  lines.push(`Cosine Similarity:         ${pct(r.cosine)}`);
  lines.push('  → Word frequency vectors. Best for: document similarity, search relevance.');
  lines.push('');
  lines.push(`Edit Distance Similarity:  ${pct(r.editDistSimilarity)}`);
  lines.push('  → Character-level edits (Levenshtein). Best for: spell checking, fuzzy matching.');
  lines.push('');
  lines.push(`LCS Similarity:            ${pct(r.lcsSimilarity)}`);
  lines.push('  → Longest common subsequence of words. Best for: sequence / order similarity.');
  lines.push('');
  lines.push(`Bigram Char Similarity:    ${pct(r.charSimilarity)}`);
  lines.push('  → Character bigram overlap. Best for: short strings, name matching.');
  lines.push('');
  lines.push('=== Overall Estimate ===');
  lines.push(`Average of all metrics:    ${pct(r.overallEstimate)}`);
  lines.push('');

  const ov = r.overallEstimate;
  let verdict: string;
  if (ov >= 0.85) verdict = 'Very High — texts are nearly identical or closely paraphrased.';
  else if (ov >= 0.65) verdict = 'High — texts share significant content.';
  else if (ov >= 0.40) verdict = 'Moderate — texts have some overlap.';
  else if (ov >= 0.20) verdict = 'Low — texts have little in common.';
  else verdict = 'Very Low — texts appear unrelated.';

  lines.push(`Interpretation: ${verdict}`);

  return lines.join('\n');
}

function tokenizeExport(text: string): string[] {
  return tokenize(text);
}

export { tokenizeExport as tokenizeText };
