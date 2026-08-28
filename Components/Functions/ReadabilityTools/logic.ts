export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function fleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const asl = words.length / sentences.length;  // avg sentence length
  const asw = syllables / words.length;          // avg syllables per word

  return 0.39 * asl + 11.8 * asw - 15.59;
}

export function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const asl = words.length / sentences.length;
  const asw = syllables / words.length;

  return 206.835 - 1.015 * asl - 84.6 * asw;
}

export function gradeDescription(grade: number): string {
  if (grade < 6) return 'Very Easy (5th grade)';
  if (grade < 8) return 'Easy (6th-7th grade)';
  if (grade < 10) return 'Standard (8th-9th grade)';
  if (grade < 12) return 'Fairly Difficult (10th-11th grade)';
  if (grade < 14) return 'Difficult (College level)';
  return 'Very Difficult (Professional)';
}

export function analyzeText(text: string): string {
  if (!text.trim()) return 'Enter text to analyze';

  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const fkGrade = fleschKincaidGrade(text);
  const fre = fleschReadingEase(text);

  const wordFreq = new Map<string, number>();
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 3) wordFreq.set(clean, (wordFreq.get(clean) ?? 0) + 1);
  });
  const topWords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w, c]) => `"${w}" x${c}`)
    .join(', ');

  return [
    `Words:          ${words.length}`,
    `Sentences:      ${sentences.length}`,
    `Paragraphs:     ${paragraphs.length}`,
    `Syllables:      ${syllables}`,
    `Avg word/sent:  ${sentences.length ? (words.length / sentences.length).toFixed(1) : 0}`,
    `Avg syl/word:   ${words.length ? (syllables / words.length).toFixed(2) : 0}`,
    '',
    `Flesch-Kincaid Grade: ${fkGrade.toFixed(1)}`,
    `Reading Level:  ${gradeDescription(fkGrade)}`,
    `Flesch Reading Ease: ${fre.toFixed(1)}/100`,
    '',
    `Top words: ${topWords || 'N/A'}`,
  ].join('\n');
}
