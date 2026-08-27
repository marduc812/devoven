// CSS Specificity Calculator

export interface SpecificityTuple {
  inline: number;   // a — inline styles
  ids: number;      // b — #id selectors
  classes: number;  // c — class/attr/pseudo-class
  elements: number; // d — element/pseudo-element
}

export interface SelectorResult {
  selector: string;
  tuple: SpecificityTuple;
  score: number; // numeric value for comparison: a*1000000 + b*10000 + c*100 + d
  label: string; // "(a,b,c,d)"
}

export interface SpecificityResult {
  selectors: SelectorResult[];
  winner: string | null; // 'A', 'B', ... or 'tie'
  error: string | null;
}

function calcTuple(selector: string): SpecificityTuple {
  let s = selector.trim();

  // Inline check (not a real CSS selector, but a hint)
  const inline = s === 'style' || s === 'inline' ? 1 : 0;
  if (inline) return { inline: 1, ids: 0, classes: 0, elements: 0 };

  // Remove pseudo-element contributions (count them then strip)
  const pseudoElements = (s.match(/::[\w-]+/g) || []).length;
  s = s.replace(/::[\w-]+/g, ' ');

  // Expand :not() — its argument contributes, but not :not itself
  s = s.replace(/:not\(([^)]+)\)/g, ' $1 ');

  // Replace attribute selectors with placeholder
  const attrCount = (s.match(/\[[^\]]+\]/g) || []).length;
  s = s.replace(/\[[^\]]+\]/g, ' ');

  // Count IDs
  const ids = (s.match(/#[\w-]+/g) || []).length;
  s = s.replace(/#[\w-]+/g, ' ');

  // Count classes
  const classCount = (s.match(/\.[\w-]+/g) || []).length;
  s = s.replace(/\.[\w-]+/g, ' ');

  // Count pseudo-classes (skip :not since already expanded)
  const pseudoClassCount = (s.match(/:[\w-]+(?:\([^)]*\))?/g) || []).length;
  s = s.replace(/:[\w-]+(?:\([^)]*\))?/g, ' ');

  // Count elements (remaining words, exclude *, combinators +>~)
  const elementCount = (s.match(/\b[a-zA-Z][\w-]*/g) || [])
    .filter(function(t) { return t !== 'not'; }).length + pseudoElements;

  const classes = classCount + attrCount + pseudoClassCount;

  return { inline, ids, elements: elementCount, classes };
}

function tupleScore(t: SpecificityTuple): number {
  return t.inline * 1000000 + t.ids * 10000 + t.classes * 100 + t.elements;
}

function tupleLabel(t: SpecificityTuple): string {
  return '(' + t.inline + ',' + t.ids + ',' + t.classes + ',' + t.elements + ')';
}

export function calcSpecificity(input: string): SpecificityResult {
  if (!input.trim()) return { selectors: [], winner: null, error: null };

  const lines = input.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  if (lines.length === 0) return { selectors: [], winner: null, error: null };

  const results: SelectorResult[] = lines.map(function(sel) {
    const tuple = calcTuple(sel);
    return {
      selector: sel,
      tuple: tuple,
      score: tupleScore(tuple),
      label: tupleLabel(tuple),
    };
  });

  let winner: string | null = null;
  if (results.length > 1) {
    const maxScore = results.reduce(function(m, r) { return Math.max(m, r.score); }, 0);
    const winners = results.filter(function(r) { return r.score === maxScore; });
    if (winners.length === results.length) {
      winner = 'tie';
    } else {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      winner = winners.map(function(w) {
        return letters[results.indexOf(w)];
      }).join(', ');
    }
  }

  return { selectors: results, winner: winner, error: null };
}
