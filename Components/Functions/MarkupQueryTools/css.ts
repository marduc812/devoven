// ─── CSS selector matching over the tree in markup.ts ────────────────────────
// A useful subset, not all of Selectors Level 4: type, universal, id, class,
// attribute, the four combinators, selector lists, and the structural
// pseudo-classes people actually type when pulling data out of a page.

import { MarkupNode, descendantElements } from './markup';

type AttributeOperator = '' | '=' | '~=' | '|=' | '^=' | '$=' | '*=';

type SimpleSelector =
  | { type: 'universal' }
  /** The `:has()` anchor: the element the relative selector is measured from. */
  | { type: 'scope' }
  | { type: 'tag'; name: string }
  | { type: 'id'; id: string }
  | { type: 'class'; className: string }
  | { type: 'attribute'; name: string; operator: AttributeOperator; value: string; insensitive: boolean }
  | { type: 'pseudo'; name: string; argument: string; inner: ComplexSelector[] | null };

type CompoundSelector = SimpleSelector[];

type Combinator = ' ' | '>' | '+' | '~';

type ComplexSelector = {
  compound: CompoundSelector;
  /** How this compound relates to the one before it; null on the first. */
  combinator: Combinator | null;
}[];

// ─── Parsing ──────────────────────────────────────────────────────────────────

/** Splits on commas and parentheses depth, so `:not(a, b)` stays in one piece. */
function splitTopLevel(selector: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const char of selector) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; current += char; continue; }
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

const SIMPLE_PATTERN = new RegExp(
  [
    '\\*',
    '#[-\\w\\u00a0-\\uffff]+',
    '\\.[-\\w\\u00a0-\\uffff]+',
    '\\[[^\\]]*\\]',
    ':{1,2}[-\\w]+(?:\\((?:[^()]|\\([^()]*\\))*\\))?',
    '[-\\w\\u00a0-\\uffff]+',
  ].join('|'),
  'g',
);

function parseCompound(text: string): CompoundSelector {
  const parts: SimpleSelector[] = [];
  let consumed = 0;

  for (const match of text.matchAll(SIMPLE_PATTERN)) {
    if (match.index !== consumed) {
      throw new Error(`Cannot read "${text.slice(consumed)}" in the selector`);
    }
    consumed = match.index + match[0].length;
    const token = match[0];

    if (token === '*') { parts.push({ type: 'universal' }); continue; }
    if (token[0] === '#') { parts.push({ type: 'id', id: token.slice(1) }); continue; }
    if (token[0] === '.') { parts.push({ type: 'class', className: token.slice(1) }); continue; }

    if (token[0] === '[') {
      const body = token.slice(1, -1).trim();
      const match2 = body.match(/^([-\w:.]+)\s*(?:([~|^$*]?=)\s*(.*?))?\s*(?:\s([iIsS]))?$/);
      if (!match2) throw new Error(`Cannot read the attribute selector "${token}"`);
      let value = match2[3] ?? '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      parts.push({
        type: 'attribute',
        name: match2[1],
        operator: (match2[2] ?? '') as AttributeOperator,
        value,
        insensitive: (match2[4] ?? '').toLowerCase() === 'i',
      });
      continue;
    }

    if (token[0] === ':') {
      const body = token.replace(/^::?/, '');
      const open = body.indexOf('(');
      const name = (open === -1 ? body : body.slice(0, open)).toLowerCase();
      const argument = open === -1 ? '' : body.slice(open + 1, body.lastIndexOf(')')).trim();
      const nested = name === 'not' || name === 'is' || name === 'where' || name === 'has';
      parts.push({
        type: 'pseudo',
        name,
        argument,
        inner: nested
          ? splitTopLevel(argument, ',').map((part) => parseComplex(part, name === 'has'))
          : null,
      });
      continue;
    }

    parts.push({ type: 'tag', name: token.toLowerCase() });
  }

  if (consumed !== text.length) throw new Error(`Cannot read "${text.slice(consumed)}" in the selector`);
  if (parts.length === 0) throw new Error('Empty selector');
  return parts;
}

/**
 * Splits a complex selector into compounds and the combinators between them.
 * A plain split on whitespace would cut `[class~="a b"]` and `:is(p, img)` in
 * half, so this tracks bracket depth and quotes instead.
 */
function splitCombinators(text: string): (string | Combinator)[] {
  const parts: (string | Combinator)[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';

  const flush = () => {
    if (current.trim() !== '') parts.push(current.trim());
    current = '';
  };

  for (const char of text.trim()) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; current += char; continue; }
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;

    if (depth === 0 && (char === '>' || char === '+' || char === '~')) {
      flush();
      parts.push(char as Combinator);
      continue;
    }
    if (depth === 0 && /\s/.test(char)) {
      if (current.trim() !== '') { flush(); parts.push(' '); }
      continue;
    }
    current += char;
  }
  flush();

  // A run of whitespace next to an explicit combinator is not a descendant step.
  return parts.filter((part, index) => {
    if (part !== ' ') return true;
    const before = parts[index - 1];
    const after = parts[index + 1];
    if (before === undefined || after === undefined) return false;
    return typeof before === 'string' && before !== ' ' &&
      after !== '>' && after !== '+' && after !== '~';
  });
}

/**
 * `relative` is for the inside of `:has()`, where a selector may start with a
 * combinator and is measured from the element being tested rather than the
 * document. Such a selector gets a `:scope` compound in front of it.
 */
function parseComplex(text: string, relative = false): ComplexSelector {
  const parts = splitCombinators(text);
  const out: ComplexSelector = [];
  let combinator: Combinator | null = null;

  if (relative) {
    out.push({ compound: [{ type: 'scope' }], combinator: null });
    if (parts.length > 0 && parts[0] !== ' ' && !['>', '+', '~'].includes(parts[0] as string)) {
      combinator = ' ';
    }
  }

  for (const part of parts) {
    if (part === '>' || part === '+' || part === '~' || part === ' ') {
      if (out.length === 0) throw new Error(`A selector cannot start with "${part.trim() || 'a combinator'}"`);
      combinator = part as Combinator;
      continue;
    }
    out.push({ compound: parseCompound(part), combinator: out.length === 0 ? null : combinator ?? ' ' });
    combinator = null;
  }

  if (out.length === 0) throw new Error('Empty selector');
  if (combinator !== null) throw new Error(`A selector cannot end with "${combinator.trim() || 'a combinator'}"`);
  return out;
}

export function parseSelector(selector: string): ComplexSelector[] {
  const groups = splitTopLevel(selector, ',');
  if (groups.length === 0) throw new Error('Enter a CSS selector');
  return groups.map((group) => parseComplex(group));
}

// ─── Matching ─────────────────────────────────────────────────────────────────

function classList(node: MarkupNode): string[] {
  return (node.attributes['class'] ?? '').split(/\s+/).filter(Boolean);
}

function elementSiblings(node: MarkupNode): MarkupNode[] {
  return (node.parent?.children ?? []).filter((c) => c.kind === 'element');
}

/** `2n+1`, `odd`, `even` and a bare index, as an "is this position a match" test. */
function matchesNth(argument: string, index: number): boolean {
  const text = argument.trim().toLowerCase();
  if (text === 'odd') return index % 2 === 1;
  if (text === 'even') return index % 2 === 0;
  if (/^\d+$/.test(text)) return index === Number(text);

  const match = text.match(/^([+-]?\d*)n\s*([+-]\s*\d+)?$/);
  if (!match) throw new Error(`Cannot read "${argument}" as an nth-child argument`);
  const rawStep = match[1];
  const step = rawStep === '' || rawStep === '+' ? 1 : rawStep === '-' ? -1 : Number(rawStep);
  const offset = match[2] ? Number(match[2].replace(/\s+/g, '')) : 0;

  if (step === 0) return index === offset;
  const n = (index - offset) / step;
  return Number.isInteger(n) && n >= 0;
}

function matchesAttribute(node: MarkupNode, part: Extract<SimpleSelector, { type: 'attribute' }>): boolean {
  const raw = node.attributes[part.name];
  if (raw === undefined) return false;
  if (part.operator === '') return true;

  const actual = part.insensitive ? raw.toLowerCase() : raw;
  const wanted = part.insensitive ? part.value.toLowerCase() : part.value;

  switch (part.operator) {
    case '=': return actual === wanted;
    case '~=': return wanted !== '' && actual.split(/\s+/).includes(wanted);
    case '|=': return actual === wanted || actual.startsWith(`${wanted}-`);
    case '^=': return wanted !== '' && actual.startsWith(wanted);
    case '$=': return wanted !== '' && actual.endsWith(wanted);
    case '*=': return wanted !== '' && actual.includes(wanted);
    default: return false;
  }
}

function matchesSimple(node: MarkupNode, part: SimpleSelector, scope: MarkupNode | null): boolean {
  switch (part.type) {
    case 'universal':
      return true;
    case 'scope':
      return node === scope;
    case 'tag':
      return node.name === part.name;
    case 'id':
      return node.attributes['id'] === part.id;
    case 'class':
      return classList(node).includes(part.className);
    case 'attribute':
      return matchesAttribute(node, part);
    case 'pseudo':
      return matchesPseudo(node, part, scope);
  }
}

function matchesPseudo(
  node: MarkupNode,
  part: Extract<SimpleSelector, { type: 'pseudo' }>,
  scope: MarkupNode | null,
): boolean {
  const siblings = elementSiblings(node);
  const sameName = siblings.filter((s) => s.name === node.name);

  switch (part.name) {
    case 'first-child': return siblings[0] === node;
    case 'last-child': return siblings[siblings.length - 1] === node;
    case 'only-child': return siblings.length === 1;
    case 'first-of-type': return sameName[0] === node;
    case 'last-of-type': return sameName[sameName.length - 1] === node;
    case 'only-of-type': return sameName.length === 1;
    case 'empty': return node.children.every((c) => c.kind === 'comment');
    case 'root': return node.parent?.name === '#document';
    case 'nth-child': return matchesNth(part.argument, siblings.indexOf(node) + 1);
    case 'nth-of-type': return matchesNth(part.argument, sameName.indexOf(node) + 1);
    case 'nth-last-child': return matchesNth(part.argument, siblings.length - siblings.indexOf(node));
    case 'nth-last-of-type': return matchesNth(part.argument, sameName.length - sameName.indexOf(node));
    case 'not': return !(part.inner ?? []).some((complex) => matchesComplex(node, complex, scope));
    case 'is':
    case 'where': return (part.inner ?? []).some((complex) => matchesComplex(node, complex, scope));
    case 'has':
      // The argument is relative to `node`, so `node` becomes the scope and the
      // search runs over the whole document: `:has(+ p)` looks sideways.
      return (part.inner ?? []).some((complex) =>
        descendantElements(documentRoot(node)).some((d) => matchesComplex(d, complex, node)));
    case 'contains':
      // Not a standard selector, but the one people reach for constantly.
      return textNodesText(node).includes(unquote(part.argument));
    default:
      throw new Error(`":${part.name}" is not supported`);
  }
}

function unquote(text: string): string {
  const trimmed = text.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function textNodesText(node: MarkupNode): string {
  if (node.kind === 'text' || node.kind === 'cdata') return node.value;
  if (node.kind === 'comment') return '';
  return node.children.map(textNodesText).join('');
}

function documentRoot(node: MarkupNode): MarkupNode {
  let current = node;
  while (current.parent) current = current.parent;
  return current;
}

function matchesCompound(node: MarkupNode, compound: CompoundSelector, scope: MarkupNode | null): boolean {
  return compound.every((part) => matchesSimple(node, part, scope));
}

/** Right to left, which is how a browser does it and why it terminates fast. */
function matchesComplex(node: MarkupNode, complex: ComplexSelector, scope: MarkupNode | null = null): boolean {
  const last = complex[complex.length - 1];
  if (!matchesCompound(node, last.compound, scope)) return false;
  return matchesFrom(node, complex, complex.length - 1, scope);
}

function matchesFrom(
  node: MarkupNode,
  complex: ComplexSelector,
  index: number,
  scope: MarkupNode | null,
): boolean {
  if (index === 0) return true;
  const combinator = complex[index].combinator ?? ' ';
  const previous = complex[index - 1];

  if (combinator === '>') {
    const parent = node.parent;
    if (!parent || parent.kind !== 'element' || parent.name === '#document') return false;
    return matchesCompound(parent, previous.compound, scope) && matchesFrom(parent, complex, index - 1, scope);
  }

  if (combinator === ' ') {
    let ancestor = node.parent;
    while (ancestor && ancestor.name !== '#document') {
      if (matchesCompound(ancestor, previous.compound, scope) && matchesFrom(ancestor, complex, index - 1, scope)) {
        return true;
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  const siblings = elementSiblings(node);
  const position = siblings.indexOf(node);
  if (combinator === '+') {
    const before = siblings[position - 1];
    if (!before) return false;
    return matchesCompound(before, previous.compound, scope) && matchesFrom(before, complex, index - 1, scope);
  }
  // '~'
  for (let i = position - 1; i >= 0; i--) {
    if (matchesCompound(siblings[i], previous.compound, scope) && matchesFrom(siblings[i], complex, index - 1, scope)) {
      return true;
    }
  }
  return false;
}

/** Every element under `root` matching the selector, in document order. */
export function queryCss(root: MarkupNode, selector: string): MarkupNode[] {
  const groups = parseSelector(selector);
  return descendantElements(root).filter((node) =>
    groups.some((complex) => matchesComplex(node, complex)));
}
