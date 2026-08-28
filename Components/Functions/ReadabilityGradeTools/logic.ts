export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  cleaned = cleaned.replace(/^y/, '');
  const m = cleaned.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function countComplexWords(words: string[]): number {
  // Gunning Fog: words with 3+ syllables that aren't proper nouns/compound/common suffixes
  let count = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z]/g, '');
    if (countSyllables(clean) >= 3) {
      // Skip common suffixes that inflate count
      const lower = clean.toLowerCase();
      if (lower.endsWith('ing') || lower.endsWith('ed') || lower.endsWith('es')) {
        // still count but check base
        const base = lower.replace(/(ing|ed|es)$/, '');
        if (countSyllables(base) < 3) continue;
      }
      count++;
    }
  }
  return count;
}

function countLetters(words: string[]): number {
  let count = 0;
  for (const w of words) {
    for (const ch of w) {
      if (/[a-zA-Z]/.test(ch)) count++;
    }
  }
  return count;
}

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  complexWordCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
}

export function computeReadabilityScores(text: string): ReadabilityScores {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0);
  const syllables = words.reduce(function(sum, w) { return sum + countSyllables(w); }, 0);
  const letterCount = countLetters(words);
  const complexWords = countComplexWords(words);

  const W = words.length;
  const S = sentences.length;
  const Sy = syllables;
  const L = letterCount;
  const C = complexWords;

  if (W === 0 || S === 0) {
    return {
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      gunningFog: 0,
      smogIndex: 0,
      colemanLiau: 0,
      automatedReadabilityIndex: 0,
      wordCount: W,
      sentenceCount: S,
      syllableCount: Sy,
      complexWordCount: C,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
    };
  }

  const asl = W / S;
  const asw = Sy / W;

  const fre = 206.835 - 1.015 * asl - 84.6 * asw;
  const fkg = 0.39 * asl + 11.8 * asw - 15.59;
  const gf = 0.4 * (asl + 100 * (C / W));
  // SMOG: need at least 30 sentences ideally; approximate
  const smog = 1.0430 * Math.sqrt(C * (30 / Math.max(S, 1))) + 3.1291;
  // Coleman-Liau: L = letters per 100 words, S = sentences per 100 words
  const lPer100 = (L / W) * 100;
  const sPer100 = (S / W) * 100;
  const cl = 0.0588 * lPer100 - 0.296 * sPer100 - 15.8;
  // ARI: characters per word and words per sentence
  const charsPerWord = L / W;
  const ari = 4.71 * charsPerWord + 0.5 * asl - 21.43;

  return {
    fleschReadingEase: Math.round(fre * 10) / 10,
    fleschKincaidGrade: Math.round(fkg * 10) / 10,
    gunningFog: Math.round(gf * 10) / 10,
    smogIndex: Math.round(smog * 10) / 10,
    colemanLiau: Math.round(cl * 10) / 10,
    automatedReadabilityIndex: Math.round(ari * 10) / 10,
    wordCount: W,
    sentenceCount: S,
    syllableCount: Sy,
    complexWordCount: C,
    avgWordsPerSentence: Math.round(asl * 10) / 10,
    avgSyllablesPerWord: Math.round(asw * 100) / 100,
  };
}

export function interpretFleschEase(score: number): string {
  if (score >= 90) return 'Very Easy (5th grade, easy to read)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College level)';
  return 'Very Difficult (Professional/Academic)';
}

export function interpretGrade(grade: number): string {
  const g = Math.round(grade);
  if (g <= 5) return 'Grade 5 or below (Elementary)';
  if (g <= 8) return `Grade ${g} (Middle School)`;
  if (g <= 12) return `Grade ${g} (High School)`;
  if (g <= 16) return `Grade ${g} (College)`;
  return `Grade ${g}+ (Graduate/Professional)`;
}

export function formatReadabilityOutput(text: string): string {
  if (!text.trim()) return 'Enter text to compute readability scores.';

  const s = computeReadabilityScores(text);

  if (s.wordCount === 0) return 'No valid words found.';
  if (s.sentenceCount === 0) return 'No sentences detected. End sentences with . ! or ?';

  const lines: string[] = [];

  lines.push('=== Text Statistics ===');
  lines.push(`Words:               ${s.wordCount}`);
  lines.push(`Sentences:           ${s.sentenceCount}`);
  lines.push(`Syllables:           ${s.syllableCount}`);
  lines.push(`Complex words (3+):  ${s.complexWordCount}`);
  lines.push(`Avg words/sentence:  ${s.avgWordsPerSentence}`);
  lines.push(`Avg syllables/word:  ${s.avgSyllablesPerWord}`);
  lines.push('');
  lines.push('=== Readability Scores ===');
  lines.push('');
  lines.push(`Flesch Reading Ease:         ${s.fleschReadingEase}/100`);
  lines.push(`  ${interpretFleschEase(s.fleschReadingEase)}`);
  lines.push(`  (Higher = easier to read)`);
  lines.push('');
  lines.push(`Flesch-Kincaid Grade Level:  ${s.fleschKincaidGrade}`);
  lines.push(`  ${interpretGrade(s.fleschKincaidGrade)}`);
  lines.push('');
  lines.push(`Gunning Fog Index:           ${s.gunningFog}`);
  lines.push(`  ${interpretGrade(s.gunningFog)}`);
  lines.push(`  (Best for: formal/business writing)`);
  lines.push('');
  lines.push(`SMOG Index:                  ${s.smogIndex}`);
  lines.push(`  ${interpretGrade(s.smogIndex)}`);
  lines.push(`  (Best for: health/medical content)`);
  lines.push('');
  lines.push(`Coleman-Liau Index:          ${s.colemanLiau}`);
  lines.push(`  ${interpretGrade(s.colemanLiau)}`);
  lines.push(`  (Based on characters, not syllables)`);
  lines.push('');
  lines.push(`Automated Readability Index: ${s.automatedReadabilityIndex}`);
  lines.push(`  ${interpretGrade(s.automatedReadabilityIndex)}`);
  lines.push(`  (Best for: real-time text analysis)`);

  return lines.join('\n');
}
