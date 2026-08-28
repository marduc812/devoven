export interface CryptarithResult {
  puzzle: string;
  solutions: Array<Record<string, number>>;
  solutionStrings: string[];
  uniqueLetters: string[];
  error: string | null;
}

/**
 * Parse a cryptarithmetic puzzle string like "SEND + MORE = MONEY"
 * Returns: { addends, sum }
 */
function parsePuzzle(puzzle: string): { addends: string[]; sum: string } {
  // Support: A + B = C or A + B + C = D etc.
  const cleaned = puzzle.toUpperCase().replace(/\s+/g, ' ').trim();
  const eqIdx = cleaned.indexOf('=');
  if (eqIdx === -1) throw new Error('Puzzle must contain "="');
  const lhs = cleaned.slice(0, eqIdx).trim();
  const rhs = cleaned.slice(eqIdx + 1).trim();

  const addends = lhs.split('+').map(s => s.trim());
  const sum = rhs.trim();

  if (addends.length === 0) throw new Error('No addends found on left side');
  if (!/^[A-Z]+$/.test(sum)) throw new Error(`Sum "${sum}" contains non-letter characters`);
  for (const a of addends) {
    if (!/^[A-Z]+$/.test(a)) throw new Error(`Addend "${a}" contains non-letter characters`);
  }

  return { addends, sum };
}

function wordToNum(word: string, assignment: Record<string, number>): number {
  let n = 0;
  for (const ch of word) {
    n = n * 10 + assignment[ch];
  }
  return n;
}

function evaluate(addends: string[], sum: string, assignment: Record<string, number>): boolean {
  const total = addends.reduce((s, w) => s + wordToNum(w, assignment), 0);
  return total === wordToNum(sum, assignment);
}

/**
 * Solve a cryptarithmetic puzzle.
 * Returns all valid digit assignments.
 */
export function solveCryptarith(puzzle: string): CryptarithResult {
  if (!puzzle.trim()) {
    return { puzzle, solutions: [], solutionStrings: [], uniqueLetters: [], error: null };
  }

  let addends: string[];
  let sum: string;
  try {
    const parsed = parsePuzzle(puzzle);
    addends = parsed.addends;
    sum = parsed.sum;
  } catch (e) {
    return { puzzle, solutions: [], solutionStrings: [], uniqueLetters: [], error: (e as Error).message };
  }

  const allWords = [...addends, sum];
  const letterSet: Record<string, boolean> = {};
  for (const word of allWords) {
    for (const ch of word) letterSet[ch] = true;
  }
  const uniqueLetters = Object.keys(letterSet).sort();

  if (uniqueLetters.length > 10) {
    return {
      puzzle,
      solutions: [],
      solutionStrings: [],
      uniqueLetters,
      error: `Too many unique letters (${uniqueLetters.length}). Maximum is 10.`,
    };
  }
  if (uniqueLetters.length > 8) {
    return {
      puzzle,
      solutions: [],
      solutionStrings: [],
      uniqueLetters,
      error: `${uniqueLetters.length} unique letters is computationally expensive. Try a puzzle with ≤8 unique letters.`,
    };
  }

  // Leading digits cannot be 0
  const leadingLetters = new Set<string>();
  for (const word of allWords) {
    if (word.length > 0) leadingLetters.add(word[0]);
  }

  const n = uniqueLetters.length;
  const assignment: Record<string, number> = {};
  const solutions: Array<Record<string, number>> = [];
  const usedDigits = new Array(10).fill(false);

  function backtrack(idx: number): void {
    if (solutions.length >= 50) return; // cap at 50 solutions
    if (idx === n) {
      if (evaluate(addends, sum, assignment)) {
        solutions.push(Object.assign({}, assignment));
      }
      return;
    }
    const letter = uniqueLetters[idx];
    const isLeading = leadingLetters.has(letter);
    for (let d = isLeading ? 1 : 0; d <= 9; d++) {
      if (!usedDigits[d]) {
        assignment[letter] = d;
        usedDigits[d] = true;
        backtrack(idx + 1);
        usedDigits[d] = false;
      }
    }
  }

  backtrack(0);

  const solutionStrings = solutions.map(sol => {
    const parts = allWords.map(word => {
      const num = word.split('').map(ch => sol[ch]).join('');
      return `${word}=${num}`;
    });
    const digits = uniqueLetters.map(l => `${l}=${sol[l]}`).join(', ');
    return `[${digits}]  →  ${parts.join(', ')}`;
  });

  return { puzzle, solutions, solutionStrings, uniqueLetters, error: null };
}

export function formatCryptarithOutput(puzzle: string): string {
  if (!puzzle.trim()) return '';
  const result = solveCryptarith(puzzle);
  const lines: string[] = [];

  lines.push(`Puzzle: ${puzzle.trim().toUpperCase()}`);
  lines.push(`Unique letters: ${result.uniqueLetters.join(', ')} (${result.uniqueLetters.length} total)`);
  lines.push('');

  if (result.error) {
    lines.push(`Error: ${result.error}`);
    return lines.join('\n');
  }

  if (result.solutions.length === 0) {
    lines.push('No solution found.');
    lines.push('');
    lines.push('Tip: Each unique letter must map to a unique digit 0-9.');
    lines.push('Leading letters cannot be 0.');
  } else {
    lines.push(`Found ${result.solutions.length} solution(s):`);
    lines.push('');
    for (let i = 0; i < result.solutionStrings.length; i++) {
      lines.push(`  ${i + 1}. ${result.solutionStrings[i]}`);
    }
    if (result.solutions.length >= 50) {
      lines.push('');
      lines.push('  (showing first 50 solutions)');
    }
  }

  return lines.join('\n');
}
