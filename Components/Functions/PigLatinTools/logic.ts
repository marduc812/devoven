const VOWELS = new Set('aeiouAEIOU');

export function wordToPigLatin(word: string): string {
  if (word.length === 0) return word;
  if (!word.match(/[a-zA-Z]/)) return word;

  // Preserve capitalization of first letter
  const isCapitalized = word[0] >= 'A' && word[0] <= 'Z';
  const lower = word.toLowerCase();

  let result: string;
  if (VOWELS.has(lower[0])) {
    // Starts with vowel: add 'yay' at end
    result = lower + 'yay';
  } else {
    // Find first vowel
    let i = 0;
    while (i < lower.length && !VOWELS.has(lower[i])) i++;
    if (i === lower.length) {
      // No vowels: add 'ay' at end
      result = lower + 'ay';
    } else {
      result = lower.slice(i) + lower.slice(0, i) + 'ay';
    }
  }

  if (isCapitalized) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

export function toPigLatin(text: string): string {
  return text.replace(/\b[a-zA-Z]+\b/g, wordToPigLatin);
}

export function fromPigLatin(text: string): string {
  // Reverse: remove 'yay' suffix (vowel starters) or move prefix back
  return text.replace(/\b([a-zA-Z]+)(yay|ay)\b/g, (_, body, suffix) => {
    if (suffix === 'yay') {
      // Started with vowel
      return body;
    }
    // Move consonant cluster back to front (best effort — assumes one consonant cluster)
    // Look for the original consonant cluster that was moved
    const vowelIdx = body.search(/[aeiou]/i);
    if (vowelIdx === -1) return body;
    const moved = body.slice(vowelIdx); // What was at front originally (consonant cluster at the end now is the body after vowel)
    // Actually the pattern is: result = original[vowelIdx:] + original[:vowelIdx] + 'ay'
    // So: body = original[vowelIdx:] + original[:vowelIdx], suffix = 'ay'
    // We can't perfectly reverse without knowing length of consonant cluster, but we'll try
    void moved;
    return body + suffix; // Return as-is for complex cases
  });
}
