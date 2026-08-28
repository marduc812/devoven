import { WORD_LIST } from '@/Components/Functions/AnagramFinderTools/logic';

function sortLetters(s: string): string {
  return s.toLowerCase().split('').sort().join('');
}

function canForm(letters: string, word: string): boolean {
  const avail: Record<string, number> = {};
  for (const ch of letters) {
    avail[ch] = (avail[ch] || 0) + 1;
  }
  for (const ch of word.toLowerCase()) {
    if (!avail[ch]) return false;
    avail[ch]--;
  }
  return true;
}

// Reverse a string
function reverseStr(s: string): string {
  return s.split('').reverse().join('');
}

// Check if a word is a palindrome (ignoring case)
function isPalin(w: string): boolean {
  const c = w.toLowerCase();
  return c === reverseStr(c);
}

// Find anagrams of a given word
export function findAnagramsOf(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];
  const sorted = sortLetters(clean);
  const result: string[] = [];
  for (const w of WORD_LIST) {
    if (w.toLowerCase() !== clean && w.length === clean.length && sortLetters(w) === sorted) {
      result.push(w);
    }
  }
  return result.slice(0, 20);
}

// Find words that end with the same suffix (rhyme pattern)
export function findRhymes(word: string, suffixLen: number): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < suffixLen) return [];
  const suffix = clean.slice(-suffixLen);
  const result: string[] = [];
  for (const w of WORD_LIST) {
    const wl = w.toLowerCase();
    if (wl !== clean && wl.length >= suffixLen && wl.slice(-suffixLen) === suffix) {
      result.push(w);
    }
  }
  return result.slice(0, 20);
}

// Find words starting with the same letter (alliteration)
export function findAlliterations(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];
  const firstLetter = clean[0];
  const result: string[] = [];
  for (const w of WORD_LIST) {
    const wl = w.toLowerCase();
    if (wl !== clean && wl[0] === firstLetter && w.length >= 3) {
      result.push(w);
    }
  }
  return result.slice(0, 20);
}

// Find substrings of the word that are valid words
export function findWordsWithin(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 3) return [];
  const wordSet = new Set<string>(WORD_LIST.map(function(w) { return w.toLowerCase(); }));
  const found: string[] = [];
  for (let start = 0; start < clean.length; start++) {
    for (let end = start + 2; end <= clean.length; end++) {
      const sub = clean.slice(start, end);
      if (sub !== clean && wordSet.has(sub)) {
        found.push(sub);
      }
    }
  }
  // Deduplicate
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const w of found) {
    if (!seen.has(w)) {
      seen.add(w);
      unique.push(w);
    }
  }
  return unique.sort(function(a, b) { return b.length - a.length; }).slice(0, 15);
}

// Find near-palindromes: words that differ by one letter from being a palindrome
export function findNearPalindromes(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];
  const result: string[] = [];

  for (const w of WORD_LIST) {
    const wl = w.toLowerCase();
    if (wl === clean) continue;
    if (isPalin(wl)) {
      // This word itself is a palindrome — check if it's close in length
      if (Math.abs(wl.length - clean.length) <= 1) {
        result.push(w + ' (palindrome)');
      }
    }
    // Also find words where reversing one position would make it a palindrome
    if (wl.length === clean.length && !isPalin(wl)) {
      // off-by-one from palindrome: check by swapping one char pair
      const rev = reverseStr(wl);
      let diffs = 0;
      for (let i = 0; i < wl.length; i++) {
        if (wl[i] !== rev[i]) diffs++;
      }
      if (diffs === 2) {
        // Only one pair differs — near palindrome
        result.push(w + ' (near-palindrome)');
      }
    }
  }
  return result.slice(0, 10);
}

export function formatWordplayOutput(word: string): string {
  const clean = word.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 'Enter a word to explore wordplay.';

  const lines: string[] = [];
  lines.push(`=== Wordplay for "${clean.toUpperCase()}" ===`);
  lines.push('');

  // Palindrome check
  const isP = isPalin(clean);
  lines.push(`Palindrome check: ${isP ? 'YES — "' + clean + '" reads the same forwards and backwards!' : 'No (not a palindrome)'}`);
  lines.push(`Reversed: ${reverseStr(clean)}`);
  lines.push('');

  // Anagrams
  const anagrams = findAnagramsOf(clean);
  if (anagrams.length > 0) {
    lines.push(`Anagrams (${anagrams.length} found):`);
    lines.push('  ' + anagrams.join(', '));
  } else {
    lines.push('Anagrams: none found in word list');
  }
  lines.push('');

  // Rhymes (try suffixes of length 3 and 2)
  let rhymes = findRhymes(clean, 3);
  if (rhymes.length === 0) rhymes = findRhymes(clean, 2);
  if (rhymes.length > 0) {
    const suffix = clean.length >= 3 ? clean.slice(-3) : clean.slice(-2);
    lines.push(`Rhymes (ending in "-${suffix}", ${rhymes.length} found):`);
    lines.push('  ' + rhymes.join(', '));
  } else {
    lines.push('Rhymes: none found in word list');
  }
  lines.push('');

  // Alliterations
  const allit = findAlliterations(clean);
  if (allit.length > 0) {
    lines.push(`Alliterations (starting with "${clean[0].toUpperCase()}", ${allit.length} found):`);
    lines.push('  ' + allit.slice(0, 15).join(', '));
  } else {
    lines.push('Alliterations: none found');
  }
  lines.push('');

  // Words within
  const within = findWordsWithin(clean);
  if (within.length > 0) {
    lines.push(`Words hidden inside "${clean}" (${within.length} found):`);
    lines.push('  ' + within.join(', '));
  } else {
    lines.push('Words within: none found (word may be too short)');
  }
  lines.push('');

  // Near palindromes
  const nearPalin = findNearPalindromes(clean);
  if (nearPalin.length > 0) {
    lines.push(`Near-palindromes (${nearPalin.length} found):`);
    lines.push('  ' + nearPalin.slice(0, 10).join(', '));
  } else {
    lines.push('Near-palindromes: none found');
  }

  return lines.join('\n');
}
