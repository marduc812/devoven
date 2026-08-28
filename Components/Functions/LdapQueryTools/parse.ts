// Segmentation, candidate selection and coverage tracking.
// Pure logic — no browser APIs.

import { FilterNode, serialize } from './ast';
import { runMatchers } from './matchers';

export type Segment = { text: string; negated: boolean };

type Connector = { token: string; negates: boolean };

// Longest first, so "without" is never read as "with" and "but not" is never
// read as "not".
const CONNECTORS: Connector[] = [
  { token: 'excluding', negates: true },
  { token: 'that have', negates: false },
  { token: 'that has', negates: false },
  { token: 'but not', negates: true },
  { token: 'without', negates: true },
  { token: 'having', negates: false },
  { token: 'except', negates: true },
  { token: 'with', negates: false },
  { token: 'and', negates: false },
  { token: 'not', negates: true },
  { token: ',', negates: false },
].sort((a, b) => b.token.length - a.token.length);

// Filler that should not count as text the tool failed to understand.
const STOPWORDS = new Set([
  'find', 'show', 'get', 'list', 'all', 'any', 'me', 'the', 'a', 'an',
  'that', 'which', 'who', 'whose', 'is', 'are', 'has', 'have',
  'accounts', 'account', 'objects', 'object',
]);

const isWordChar = (ch: string | undefined) => ch !== undefined && /\w/.test(ch);

function connectorAt(input: string, lower: string, i: number): Connector | null {
  for (const c of CONNECTORS) {
    if (!lower.startsWith(c.token, i)) continue;
    if (c.token === ',') return c;
    if (isWordChar(input[i - 1]) || isWordChar(input[i + c.token.length])) continue;
    return c;
  }
  return null;
}

// Walks the string once, tracking quote state so a connector inside a quoted
// value never splits the input.
function scanSplit(
  input: string,
  hit: (input: string, lower: string, i: number) => { length: number; negates: boolean } | null,
): Segment[] {
  const lower = input.toLowerCase();
  const out: Segment[] = [];
  let current = '';
  let negated = false;
  let quote: string | null = null;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      i++;
      continue;
    }
    const found = hit(input, lower, i);
    if (found) {
      out.push({ text: current, negated });
      current = '';
      negated = found.negates;
      i += found.length;
      continue;
    }
    current += ch;
    i++;
  }
  out.push({ text: current, negated });
  return out.filter(s => s.text.trim() !== '');
}

export function segment(input: string): Segment[] {
  return scanSplit(input, (raw, lower, i) => {
    const c = connectorAt(raw, lower, i);
    return c ? { length: c.token.length, negates: c.negates } : null;
  });
}

function splitOnOr(input: string): string[] {
  return scanSplit(input, (raw, lower, i) => {
    if (!lower.startsWith('or', i)) return null;
    if (isWordChar(raw[i - 1]) || isWordChar(raw[i + 2])) return null;
    return { length: 2, negates: false };
  }).map(s => s.text);
}

// Punctuation-only fragments are noise, not text the tool failed to read.
const leftoverTokens = (text: string): string[] =>
  (text.match(/[\w@.*'-]+/g) ?? [])
    .filter(t => /[a-z0-9]/i.test(t))
    .filter(t => !STOPWORDS.has(t.toLowerCase()));

const isObjectClass = (n: FilterNode) => n.type === 'cond' && n.attr === 'objectClass';

function unique<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function combineAnd(nodes: FilterNode[]): FilterNode | null {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];
  return { type: 'and', children: nodes };
}

type Candidate = {
  nodes: FilterNode[];
  explanations: string[];
  warnings: string[];
  leftover: string[];
  claimedObjectClass: boolean;
};

function wholeCandidate(text: string, now: Date): Candidate {
  const r = runMatchers(text, now);
  return {
    nodes: r.nodes,
    explanations: r.explanations,
    warnings: r.warnings,
    leftover: leftoverTokens(r.leftover),
    claimedObjectClass: r.explanations.some(e => e.includes('objectClass=')),
  };
}

function orCandidate(text: string, now: Date): Candidate | null {
  const pieces = splitOnOr(text);
  if (pieces.length < 2) return null;

  const results = pieces.map(p => runMatchers(p, now));

  // An objectClass constrains the whole search, not one branch of a
  // disjunction: "users in IT or HR department" means users AND (IT or HR),
  // never (users AND IT) OR HR. Lift it out when every branch that names a
  // class names the same one, and leave it alone when they genuinely differ.
  const classValues = new Set(
    results.flatMap(r => r.nodes.filter(isObjectClass)).map(n => (n as { value: string }).value),
  );
  const hoisted = classValues.size === 1
    ? results.flatMap(r => r.nodes).find(isObjectClass)
    : undefined;

  const branches = results
    .map(r => combineAnd(hoisted ? r.nodes.filter(n => !isObjectClass(n)) : r.nodes))
    .filter((n): n is FilterNode => n !== null);
  if (branches.length < 2) return null;

  return {
    nodes: hoisted
      ? [hoisted, { type: 'or', children: branches }]
      : [{ type: 'or', children: branches }],
    explanations: results.flatMap(r => r.explanations),
    warnings: results.flatMap(r => r.warnings),
    leftover: results.flatMap(r => leftoverTokens(r.leftover)),
    claimedObjectClass: results.some(r => r.explanations.some(e => e.includes('objectClass='))),
  };
}

// A value list and a clause-level OR look identical until you try both:
// whichever reading leaves less of the user's text unaccounted for wins.
function parseSegment(text: string, now: Date): Candidate {
  const whole = wholeCandidate(text, now);
  const split = orCandidate(text, now);
  if (split && split.leftover.length < whole.leftover.length) return split;
  return whole;
}

export const UNPARSED_WARNING_PREFIX = 'Could not interpret: ';

export type ParseResult = {
  tree: FilterNode | null;
  explanation: string[];
  warnings: string[];
  unparsed: string[];
};

export function parseQuery(input: string, now: Date = new Date()): ParseResult {
  if (!input.trim()) {
    return { tree: null, explanation: [], warnings: [], unparsed: [] };
  }

  const top: FilterNode[] = [];
  const explanation: string[] = [];
  const warnings: string[] = [];
  const unparsed: string[] = [];
  let claimedObjectClass = false;

  for (const seg of segment(input)) {
    const candidate = parseSegment(seg.text, now);
    claimedObjectClass = claimedObjectClass || candidate.claimedObjectClass;
    explanation.push(...candidate.explanations);
    warnings.push(...candidate.warnings);
    unparsed.push(...candidate.leftover);

    if (seg.negated) {
      const combined = combineAnd(candidate.nodes);
      if (combined) top.push({ type: 'not', child: combined });
    } else {
      top.push(...candidate.nodes);
    }
  }

  if (!claimedObjectClass) {
    top.unshift({ type: 'cond', attr: 'objectClass', op: '=', value: 'user' });
    explanation.unshift('Targeting user objects (objectClass=user)');
  }

  // Separate clauses can describe the same condition ("active … but not
  // disabled"); an identical conjunct twice is noise, not extra meaning.
  const deduped = unique(top, serialize);

  // Also surfaced as warnings so non-UI consumers see them, but the UI renders
  // `unparsed` in its own block and filters these back out by prefix.
  for (const token of unparsed) {
    warnings.push(`${UNPARSED_WARNING_PREFIX}"${token}"`);
  }

  return {
    tree: combineAnd(deduped),
    explanation: unique(explanation, e => e),
    warnings: unique(warnings, w => w),
    unparsed,
  };
}
