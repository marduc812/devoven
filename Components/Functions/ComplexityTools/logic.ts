// ─── Code Complexity Estimator Logic ─────────────────────────────────────────

export type ComplexityRating = 'low' | 'medium' | 'high' | 'very high';

export type ComplexityResult = {
  cyclomaticComplexity: number;
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  codeLines: number;
  commentRatio: number;
  maxNestingDepth: number;
  rating: ComplexityRating;
  ratingNote: string;
  branches: {
    ifElse: number;
    loops: number;
    switchCase: number;
    exceptions: number;
    logicalOps: number;
    ternary: number;
  };
  formatted: string;
};

export function estimateComplexity(code: string): ComplexityResult {
  const lines = code.split('\n');
  const linesOfCode = lines.length;

  // Count blank lines
  const blankLines = lines.filter(l => l.trim() === '').length;

  // Comment detection (heuristic — works for C-style, Python, Ruby, etc.)
  const commentLineRegex = /^\s*(\/\/|#|--|\/\*|\*|;|\*\/)/;
  const commentLines = lines.filter(l => commentLineRegex.test(l)).length;
  const codeLines = linesOfCode - blankLines - commentLines;
  const commentRatio = codeLines > 0
    ? Math.round((commentLines / (commentLines + codeLines)) * 100)
    : 0;

  // Strip string literals to avoid false matches inside strings
  const stripped = code
    .replace(/`[^`]*`/g, '""')       // template literals
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')  // double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, "''"); // single-quoted strings

  // Branch counting (case-insensitive)
  const countMatches = (pattern: RegExp) => {
    const matches = stripped.match(pattern);
    return matches ? matches.length : 0;
  };

  const ifElse = countMatches(/\b(?:if|else\s+if|elif|elsif|unless)\b/gi);
  const loops = countMatches(/\b(?:for|while|do|foreach|loop|until|repeat)\b/gi);
  const switchCase = countMatches(/\b(?:case|when|default)\b(?!\s*:?\s*>)/gi);  // exclude generics
  const exceptions = countMatches(/\b(?:catch|except|rescue|finally|ensure)\b/gi);
  const logicalOps = countMatches(/&&|\|\||\band\b|\bor\b/gi);
  const ternary = countMatches(/\?(?!\?|\.)/g);  // ? operator, not ?. or ??

  // Cyclomatic complexity = 1 + decision points
  const decisionPoints = ifElse + loops + switchCase + exceptions + logicalOps + ternary;
  const cyclomaticComplexity = 1 + decisionPoints;

  // Nesting depth (track open/close braces / indentation)
  let maxDepth = 0;
  let depth = 0;
  for (const ch of stripped) {
    if (ch === '{') {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  // If no braces found, try indentation depth
  if (maxDepth === 0) {
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed === '') continue;
      const indent = line.length - trimmed.length;
      const spaces = Math.floor(indent / 2);
      if (spaces > maxDepth) maxDepth = spaces;
    }
  }

  // Rating thresholds
  let rating: ComplexityRating;
  let ratingNote: string;
  if (cyclomaticComplexity <= 5) {
    rating = 'low';
    ratingNote = 'Simple, easy to test and maintain.';
  } else if (cyclomaticComplexity <= 10) {
    rating = 'medium';
    ratingNote = 'Moderate complexity. Consider adding tests.';
  } else if (cyclomaticComplexity <= 20) {
    rating = 'high';
    ratingNote = 'High complexity. Refactoring recommended.';
  } else {
    rating = 'very high';
    ratingNote = 'Very high complexity. Hard to maintain and test.';
  }

  const bar = (n: number, max: number) => {
    const filled = Math.min(20, Math.round((n / Math.max(max, 1)) * 20));
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
  };

  const formatted = [
    `╔══════════════════════════════════════════════════╗`,
    `║  Code Complexity Analysis                        ║`,
    `╚══════════════════════════════════════════════════╝`,
    ``,
    `─── Cyclomatic Complexity ──────────────────────────`,
    `  Score:      ${cyclomaticComplexity}  →  ${rating.toUpperCase()}`,
    `  ${bar(cyclomaticComplexity, 25)}  (max 25+)`,
    `  ${ratingNote}`,
    ``,
    `─── Lines of Code ──────────────────────────────────`,
    `  Total lines:    ${linesOfCode}`,
    `  Code lines:     ${codeLines}`,
    `  Comment lines:  ${commentLines}  (${commentRatio}% comment ratio)`,
    `  Blank lines:    ${blankLines}`,
    `  Max nesting:    ${maxDepth} levels deep`,
    ``,
    `─── Branch Breakdown ───────────────────────────────`,
    `  if / else if:        ${ifElse}`,
    `  loops (for/while):   ${loops}`,
    `  switch / case:       ${switchCase}`,
    `  catch / except:      ${exceptions}`,
    `  logical && / ||:     ${logicalOps}`,
    `  ternary ?:           ${ternary}`,
    `  ──────────────────────────────`,
    `  Decision points:     ${decisionPoints}`,
    `  Cyclomatic score:    ${cyclomaticComplexity} (= 1 + ${decisionPoints})`,
    ``,
    `─── Thresholds ─────────────────────────────────────`,
    `  1–5:   Low       (simple)`,
    `  6–10:  Medium    (moderate)`,
    `  11–20: High      (complex)`,
    `  21+:   Very High (very complex)`,
  ].join('\n');

  return {
    cyclomaticComplexity,
    linesOfCode,
    blankLines,
    commentLines,
    codeLines,
    commentRatio,
    maxNestingDepth: maxDepth,
    rating,
    ratingNote,
    branches: { ifElse, loops, switchCase, exceptions, logicalOps, ternary },
    formatted,
  };
}
