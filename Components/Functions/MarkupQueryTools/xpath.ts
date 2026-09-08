// ─── An XPath 1.0 subset over the tree in markup.ts ──────────────────────────
// Location paths with the common axes, predicates, and the string and boolean
// functions people use to pull values out of a document. Not a conforming
// implementation: no namespaces, no numeric axes beyond position, no id().

import { MarkupNode, textContent } from './markup';

export type XPathItem =
  | { kind: 'node'; node: MarkupNode }
  | { kind: 'attribute'; name: string; value: string; owner: MarkupNode };

export type XPathResult =
  | { type: 'nodes'; items: XPathItem[] }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean };

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type Token = { type: 'name' | 'number' | 'string' | 'punct'; text: string };

const PUNCT = ['//', '::', '..', '!=', '<=', '>=', '(', ')', '[', ']', '@', ',', '.', '/', '|', '+', '-', '*', '=', '<', '>'];

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];
    if (/\s/.test(char)) { i++; continue; }

    if (char === '"' || char === "'") {
      const end = expression.indexOf(char, i + 1);
      if (end === -1) throw new Error('Unterminated string in the expression');
      tokens.push({ type: 'string', text: expression.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    if (/\d/.test(char) || (char === '.' && /\d/.test(expression[i + 1] ?? ''))) {
      const match = expression.slice(i).match(/^\d*\.?\d+/)!;
      tokens.push({ type: 'number', text: match[0] });
      i += match[0].length;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = expression.slice(i).match(/^[A-Za-z_][-\w.]*(?::[A-Za-z_][-\w.]*)?/)!;
      tokens.push({ type: 'name', text: match[0] });
      i += match[0].length;
      continue;
    }

    const punct = PUNCT.find((p) => expression.startsWith(p, i));
    if (!punct) throw new Error(`Cannot read "${char}" in the expression`);
    tokens.push({ type: 'punct', text: punct });
    i += punct.length;
  }

  return tokens;
}

// ─── AST ──────────────────────────────────────────────────────────────────────

type Axis =
  | 'child' | 'descendant' | 'descendant-or-self' | 'parent' | 'ancestor'
  | 'self' | 'attribute' | 'following-sibling' | 'preceding-sibling';

type NodeTest =
  | { kind: 'name'; name: string }
  | { kind: 'any' }
  | { kind: 'text' }
  | { kind: 'comment' }
  | { kind: 'node' };

type Step = { axis: Axis; test: NodeTest; predicates: Expression[] };

type Expression =
  | { type: 'path'; absolute: boolean; steps: Step[] }
  | { type: 'binary'; operator: string; left: Expression; right: Expression }
  | { type: 'negate'; operand: Expression }
  | { type: 'literal'; value: string }
  | { type: 'number'; value: number }
  | { type: 'call'; name: string; args: Expression[] }
  | { type: 'union'; parts: Expression[] };

// ─── Parser ───────────────────────────────────────────────────────────────────

const AXIS_NAMES: Axis[] = [
  'child', 'descendant', 'descendant-or-self', 'parent', 'ancestor',
  'self', 'attribute', 'following-sibling', 'preceding-sibling',
];

class Parser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.position + offset];
  }

  private at(text: string): boolean {
    const token = this.peek();
    return token !== undefined && token.text === text && token.type === 'punct';
  }

  private take(text: string): void {
    if (!this.at(text)) throw new Error(`Expected "${text}" in the expression`);
    this.position++;
  }

  parse(): Expression {
    const expression = this.parseOr();
    if (this.position !== this.tokens.length) {
      throw new Error(`Unexpected "${this.peek()!.text}" in the expression`);
    }
    return expression;
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    while (this.peek()?.type === 'name' && this.peek()!.text === 'or') {
      this.position++;
      left = { type: 'binary', operator: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseComparison();
    while (this.peek()?.type === 'name' && this.peek()!.text === 'and') {
      this.position++;
      left = { type: 'binary', operator: 'and', left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseUnion();
    while (['=', '!=', '<', '<=', '>', '>='].some((op) => this.at(op))) {
      const operator = this.peek()!.text;
      this.position++;
      left = { type: 'binary', operator, left, right: this.parseUnion() };
    }
    return left;
  }

  private parseUnion(): Expression {
    const parts = [this.parseUnary()];
    while (this.at('|')) {
      this.position++;
      parts.push(this.parseUnary());
    }
    return parts.length === 1 ? parts[0] : { type: 'union', parts };
  }

  private parseUnary(): Expression {
    if (this.at('-')) {
      this.position++;
      return { type: 'negate', operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    const token = this.peek();
    if (!token) throw new Error('The expression ends too early');

    if (token.type === 'string') { this.position++; return { type: 'literal', value: token.text }; }
    if (token.type === 'number') { this.position++; return { type: 'number', value: Number(token.text) }; }

    if (this.at('(')) {
      this.position++;
      const inner = this.parseOr();
      this.take(')');
      return inner;
    }

    // A function call, unless the name is really a node test or an axis.
    if (token.type === 'name' && this.peek(1)?.text === '(' &&
        !['text', 'node', 'comment', 'processing-instruction'].includes(token.text)) {
      this.position += 2;
      const args: Expression[] = [];
      if (!this.at(')')) {
        args.push(this.parseOr());
        while (this.at(',')) {
          this.position++;
          args.push(this.parseOr());
        }
      }
      this.take(')');
      return { type: 'call', name: token.text, args };
    }

    return this.parsePath();
  }

  private parsePath(): Expression {
    const steps: Step[] = [];
    let absolute = false;

    if (this.at('/') || this.at('//')) {
      absolute = true;
      if (this.at('//')) {
        this.position++;
        steps.push({ axis: 'descendant-or-self', test: { kind: 'node' }, predicates: [] });
      } else {
        this.position++;
      }
      // A lone `/` selects the document root.
      if (this.position >= this.tokens.length) return { type: 'path', absolute, steps };
    }

    steps.push(this.parseStep());
    while (this.at('/') || this.at('//')) {
      if (this.at('//')) {
        this.position++;
        steps.push({ axis: 'descendant-or-self', test: { kind: 'node' }, predicates: [] });
      } else {
        this.position++;
      }
      steps.push(this.parseStep());
    }

    return { type: 'path', absolute, steps };
  }

  private parseStep(): Step {
    if (this.at('..')) { this.position++; return this.withPredicates({ axis: 'parent', test: { kind: 'node' }, predicates: [] }); }
    if (this.at('.')) { this.position++; return this.withPredicates({ axis: 'self', test: { kind: 'node' }, predicates: [] }); }

    let axis: Axis = 'child';
    if (this.at('@')) {
      this.position++;
      axis = 'attribute';
    } else if (this.peek()?.type === 'name' && this.peek(1)?.text === '::') {
      const name = this.peek()!.text as Axis;
      if (!AXIS_NAMES.includes(name)) throw new Error(`The "${name}" axis is not supported`);
      axis = name;
      this.position += 2;
    }

    const token = this.peek();
    if (!token) throw new Error('A step is missing its node test');

    let test: NodeTest;
    if (token.text === '*' && token.type === 'punct') {
      this.position++;
      test = { kind: 'any' };
    } else if (token.type === 'name' && this.peek(1)?.text === '(') {
      const name = token.text;
      this.position += 2;
      this.take(')');
      if (name === 'text') test = { kind: 'text' };
      else if (name === 'comment') test = { kind: 'comment' };
      else if (name === 'node') test = { kind: 'node' };
      else throw new Error(`"${name}()" is not a supported node test`);
    } else if (token.type === 'name') {
      this.position++;
      test = { kind: 'name', name: token.text };
    } else {
      throw new Error(`Cannot read "${token.text}" as a node test`);
    }

    return this.withPredicates({ axis, test, predicates: [] });
  }

  private withPredicates(step: Step): Step {
    while (this.at('[')) {
      this.position++;
      step.predicates.push(this.parseOr());
      this.take(']');
    }
    return step;
  }
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

function itemName(item: XPathItem): string {
  return item.kind === 'attribute' ? item.name : item.node.name;
}

function itemString(item: XPathItem): string {
  return item.kind === 'attribute' ? item.value : textContent(item.node);
}

function childNodes(node: MarkupNode): MarkupNode[] {
  return node.children;
}

function descendants(node: MarkupNode): MarkupNode[] {
  const out: MarkupNode[] = [];
  const walk = (current: MarkupNode) => {
    for (const child of current.children) {
      out.push(child);
      walk(child);
    }
  };
  walk(node);
  return out;
}

function ancestors(node: MarkupNode): MarkupNode[] {
  const out: MarkupNode[] = [];
  let current = node.parent;
  while (current) { out.push(current); current = current.parent; }
  return out;
}

function testMatches(node: MarkupNode, test: NodeTest): boolean {
  switch (test.kind) {
    case 'node': return true;
    case 'any': return node.kind === 'element';
    case 'text': return node.kind === 'text' || node.kind === 'cdata';
    case 'comment': return node.kind === 'comment';
    case 'name': return node.kind === 'element' && node.name === test.name;
  }
}

function stepItems(item: XPathItem, step: Step): XPathItem[] {
  if (item.kind === 'attribute') {
    // An attribute has no children; only self and parent lead anywhere.
    if (step.axis === 'self') return [item];
    if (step.axis === 'parent' || step.axis === 'ancestor') {
      return [{ kind: 'node', node: item.owner }];
    }
    return [];
  }

  const node = item.node;

  if (step.axis === 'attribute') {
    return Object.entries(node.attributes)
      .filter(([name]) => step.test.kind === 'any' || step.test.kind === 'node' ||
        (step.test.kind === 'name' && step.test.name === name))
      .map(([name, value]) => ({ kind: 'attribute' as const, name, value, owner: node }));
  }

  let candidates: MarkupNode[];
  switch (step.axis) {
    case 'child': candidates = childNodes(node); break;
    case 'descendant': candidates = descendants(node); break;
    case 'descendant-or-self': candidates = [node, ...descendants(node)]; break;
    case 'parent': candidates = node.parent ? [node.parent] : []; break;
    case 'ancestor': candidates = ancestors(node); break;
    case 'self': candidates = [node]; break;
    case 'following-sibling': {
      const siblings = node.parent?.children ?? [];
      candidates = siblings.slice(siblings.indexOf(node) + 1);
      break;
    }
    case 'preceding-sibling': {
      const siblings = node.parent?.children ?? [];
      candidates = siblings.slice(0, siblings.indexOf(node));
      break;
    }
    default: candidates = [];
  }

  return candidates
    .filter((candidate) => testMatches(candidate, step.test))
    .map((candidate) => ({ kind: 'node' as const, node: candidate }));
}

/** Drops the repeats an axis can produce, comparing nodes by identity. */
function unique(items: XPathItem[]): XPathItem[] {
  const seenNodes = new Set<MarkupNode>();
  const seenAttributes = new Set<string>();
  const out: XPathItem[] = [];
  for (const item of items) {
    if (item.kind === 'node') {
      if (seenNodes.has(item.node)) continue;
      seenNodes.add(item.node);
    } else {
      const key = `${item.name}\u0000${item.value}\u0000${nodeId(item.owner)}`;
      if (seenAttributes.has(key)) continue;
      seenAttributes.add(key);
    }
    out.push(item);
  }
  return out;
}

// Object identity is what matters, so hand out a stable id per node rather than
// stringifying a tree that has a parent pointer in it.
const nodeIds = new WeakMap<MarkupNode, number>();
let nextNodeId = 0;
function nodeId(node: MarkupNode): number {
  const existing = nodeIds.get(node);
  if (existing !== undefined) return existing;
  nodeIds.set(node, ++nextNodeId);
  return nextNodeId;
}

type Context = { item: XPathItem; position: number; size: number; root: MarkupNode };

function toBoolean(value: XPathResult): boolean {
  switch (value.type) {
    case 'nodes': return value.items.length > 0;
    case 'string': return value.value.length > 0;
    case 'number': return value.value !== 0 && !Number.isNaN(value.value);
    case 'boolean': return value.value;
  }
}

function toStringValue(value: XPathResult): string {
  switch (value.type) {
    case 'nodes': return value.items.length === 0 ? '' : itemString(value.items[0]);
    case 'string': return value.value;
    case 'number': return String(value.value);
    case 'boolean': return value.value ? 'true' : 'false';
  }
}

function toNumber(value: XPathResult): number {
  if (value.type === 'number') return value.value;
  if (value.type === 'boolean') return value.value ? 1 : 0;
  const text = toStringValue(value).trim();
  return text === '' ? NaN : Number(text);
}

function compare(operator: string, left: XPathResult, right: XPathResult): boolean {
  const relational = operator !== '=' && operator !== '!=';

  // A node-set compares true when any one of its members does.
  if (left.type === 'nodes' || right.type === 'nodes') {
    const leftValues = left.type === 'nodes' ? left.items.map(itemString) : [toStringValue(left)];
    const rightValues = right.type === 'nodes' ? right.items.map(itemString) : [toStringValue(right)];
    for (const a of leftValues) {
      for (const b of rightValues) {
        const matched = relational
          ? compareNumbers(operator, Number(a), Number(b))
          : (operator === '=' ? a === b : a !== b);
        if (matched) return true;
      }
    }
    return false;
  }

  if (relational) return compareNumbers(operator, toNumber(left), toNumber(right));
  if (left.type === 'boolean' || right.type === 'boolean') {
    const equal = toBoolean(left) === toBoolean(right);
    return operator === '=' ? equal : !equal;
  }
  if (left.type === 'number' || right.type === 'number') {
    const equal = toNumber(left) === toNumber(right);
    return operator === '=' ? equal : !equal;
  }
  const equal = toStringValue(left) === toStringValue(right);
  return operator === '=' ? equal : !equal;
}

function compareNumbers(operator: string, a: number, b: number): boolean {
  switch (operator) {
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
    default: return false;
  }
}

function callFunction(name: string, args: XPathResult[], context: Context): XPathResult {
  const str = (index: number) => toStringValue(args[index] ?? { type: 'string', value: '' });
  const num = (index: number) => toNumber(args[index] ?? { type: 'number', value: NaN });

  switch (name) {
    case 'true': return { type: 'boolean', value: true };
    case 'false': return { type: 'boolean', value: false };
    case 'not': return { type: 'boolean', value: !toBoolean(args[0] ?? { type: 'boolean', value: false }) };
    case 'boolean': return { type: 'boolean', value: toBoolean(args[0]) };
    case 'position': return { type: 'number', value: context.position };
    case 'last': return { type: 'number', value: context.size };
    case 'count':
      if (args[0]?.type !== 'nodes') throw new Error('count() needs a node-set');
      return { type: 'number', value: args[0].items.length };
    case 'string':
      return { type: 'string', value: args.length ? str(0) : itemString(context.item) };
    case 'concat': return { type: 'string', value: args.map(toStringValue).join('') };
    case 'contains': return { type: 'boolean', value: str(0).includes(str(1)) };
    case 'starts-with': return { type: 'boolean', value: str(0).startsWith(str(1)) };
    case 'ends-with': return { type: 'boolean', value: str(0).endsWith(str(1)) };
    case 'string-length':
      return { type: 'number', value: (args.length ? str(0) : itemString(context.item)).length };
    case 'normalize-space':
      return { type: 'string', value: (args.length ? str(0) : itemString(context.item)).trim().replace(/\s+/g, ' ') };
    case 'substring': {
      const start = Math.round(num(1));
      const length = args.length > 2 ? Math.round(num(2)) : Infinity;
      return { type: 'string', value: str(0).slice(Math.max(start - 1, 0), start - 1 + length) };
    }
    case 'substring-before': {
      const index = str(0).indexOf(str(1));
      return { type: 'string', value: index === -1 ? '' : str(0).slice(0, index) };
    }
    case 'substring-after': {
      const index = str(0).indexOf(str(1));
      return { type: 'string', value: index === -1 ? '' : str(0).slice(index + str(1).length) };
    }
    case 'translate': {
      const from = [...str(1)];
      const to = [...str(2)];
      return {
        type: 'string',
        value: [...str(0)].map((c) => {
          const index = from.indexOf(c);
          if (index === -1) return c;
          return to[index] ?? '';
        }).join(''),
      };
    }
    case 'lower-case': return { type: 'string', value: str(0).toLowerCase() };
    case 'upper-case': return { type: 'string', value: str(0).toUpperCase() };
    case 'number': return { type: 'number', value: args.length ? num(0) : Number(itemString(context.item)) };
    case 'name':
    case 'local-name': {
      const target = args[0]?.type === 'nodes' ? args[0].items[0] : context.item;
      return { type: 'string', value: target ? itemName(target) : '' };
    }
    default:
      throw new Error(`"${name}()" is not supported`);
  }
}

function evaluate(expression: Expression, context: Context): XPathResult {
  switch (expression.type) {
    case 'literal': return { type: 'string', value: expression.value };
    case 'number': return { type: 'number', value: expression.value };
    case 'negate': return { type: 'number', value: -toNumber(evaluate(expression.operand, context)) };
    case 'union': {
      const items = expression.parts.flatMap((part) => {
        const value = evaluate(part, context);
        if (value.type !== 'nodes') throw new Error('"|" joins node-sets only');
        return value.items;
      });
      return { type: 'nodes', items: unique(items) };
    }
    case 'call':
      return callFunction(expression.name, expression.args.map((a) => evaluate(a, context)), context);
    case 'binary': {
      if (expression.operator === 'and') {
        return { type: 'boolean', value: toBoolean(evaluate(expression.left, context)) && toBoolean(evaluate(expression.right, context)) };
      }
      if (expression.operator === 'or') {
        return { type: 'boolean', value: toBoolean(evaluate(expression.left, context)) || toBoolean(evaluate(expression.right, context)) };
      }
      return {
        type: 'boolean',
        value: compare(expression.operator, evaluate(expression.left, context), evaluate(expression.right, context)),
      };
    }
    case 'path':
      return { type: 'nodes', items: evaluatePath(expression, context) };
  }
}

function applyPredicates(items: XPathItem[], predicates: Expression[], root: MarkupNode): XPathItem[] {
  let current = items;
  for (const predicate of predicates) {
    const size = current.length;
    current = current.filter((item, index) => {
      const value = evaluate(predicate, { item, position: index + 1, size, root });
      return value.type === 'number' ? value.value === index + 1 : toBoolean(value);
    });
  }
  return current;
}

function evaluatePath(path: Extract<Expression, { type: 'path' }>, context: Context): XPathItem[] {
  let items: XPathItem[] = path.absolute
    ? [{ kind: 'node', node: context.root }]
    : [context.item];

  for (const step of path.steps) {
    const next: XPathItem[] = [];
    // A predicate counts positions within one context node's results, so
    // `//book/*[1]` is the first child of each book, not the first overall.
    for (const item of items) {
      next.push(...applyPredicates(stepItems(item, step), step.predicates, context.root));
    }
    items = unique(next);
  }

  return items;
}

/** Runs an expression against a parsed document. */
export function evaluateXPath(root: MarkupNode, expression: string): XPathResult {
  const text = expression.trim();
  if (!text) throw new Error('Enter an XPath expression');
  const ast = new Parser(tokenize(text)).parse();
  return evaluate(ast, { item: { kind: 'node', node: root }, position: 1, size: 1, root });
}

/** The matches as strings, whatever kind of result the expression produced. */
export function xpathValues(result: XPathResult): string[] {
  if (result.type === 'nodes') return result.items.map(itemString);
  return [toStringValue(result)];
}
