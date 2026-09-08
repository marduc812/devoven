// ─── XPath and CSS extraction ────────────────────────────────────────────────
// The two query tools share a document tree; this is what the pages and the
// blocks operations call.

import {
  MarkupMode,
  MarkupNode,
  parseMarkup,
  serialize,
  textContent,
  nodePath,
} from './markup';
import { queryCss } from './css';
import { evaluateXPath, XPathItem, XPathResult } from './xpath';

export * from './markup';
export * from './css';
export * from './xpath';

/** What to show for each match. */
export type QueryOutput = 'text' | 'markup' | 'attribute' | 'path' | 'json';

export type QueryOptions = {
  mode?: MarkupMode;
  output?: QueryOutput;
  /** Attribute to read when `output` is `attribute`. */
  attribute?: string;
  /** Collapse runs of whitespace in text output. */
  trim?: boolean;
};

const collapse = (text: string, trim: boolean): string =>
  trim ? text.trim().replace(/\s+/g, ' ') : text;

function renderNode(node: MarkupNode, options: QueryOptions): string {
  const output = options.output ?? 'text';
  const trim = options.trim ?? true;
  switch (output) {
    case 'markup': return serialize(node, options.mode ?? 'html');
    case 'attribute': return node.attributes[options.attribute ?? ''] ?? '';
    case 'path': return nodePath(node);
    case 'json': return JSON.stringify({
      tag: node.name,
      attributes: node.attributes,
      text: collapse(textContent(node), trim),
    });
    default: return collapse(textContent(node), trim);
  }
}

function renderItem(item: XPathItem, options: QueryOptions): string {
  if (item.kind === 'attribute') {
    if ((options.output ?? 'text') === 'json') {
      return JSON.stringify({ attribute: item.name, value: item.value, on: item.owner.name });
    }
    if ((options.output ?? 'text') === 'path') return `${nodePath(item.owner)}/@${item.name}`;
    return item.value;
  }
  if (item.node.kind !== 'element') {
    const output = options.output ?? 'text';
    if (output === 'markup') return serialize(item.node, options.mode ?? 'html');
    if (output === 'path') return nodePath(item.node);
    if (output === 'json') return JSON.stringify({ kind: item.node.kind, text: item.node.value });
    return collapse(item.node.value, options.trim ?? true);
  }
  return renderNode(item.node, options);
}

// ─── CSS selector extraction ──────────────────────────────────────────────────

export type CssQueryResult = {
  count: number;
  rows: string[];
};

export function runCssQuery(source: string, selector: string, options: QueryOptions = {}): CssQueryResult {
  if (!selector.trim()) throw new Error('Enter a CSS selector');
  const root = parseMarkup(source, options.mode ?? 'html');
  const matches = queryCss(root, selector);
  return {
    count: matches.length,
    rows: matches.map((node) => renderNode(node, options)),
  };
}

/** The pipeline form: one match per line, and an error when nothing matched. */
export function cssExtract(source: string, selector: string, options: QueryOptions = {}): string {
  const result = runCssQuery(source, selector, options);
  if (result.count === 0) throw new Error(`Nothing matched "${selector}"`);
  return result.rows.join('\n');
}

// ─── XPath extraction ─────────────────────────────────────────────────────────

export type XPathQueryResult = {
  /** `nodes`, or the scalar type the expression produced. */
  type: XPathResult['type'];
  count: number;
  rows: string[];
};

export function runXPathQuery(source: string, expression: string, options: QueryOptions = {}): XPathQueryResult {
  const root = parseMarkup(source, options.mode ?? 'xml');
  const result = evaluateXPath(root, expression);

  if (result.type !== 'nodes') {
    const value = result.type === 'boolean' ? String(result.value)
      : result.type === 'number' ? String(result.value)
      : result.value;
    return { type: result.type, count: 1, rows: [value] };
  }

  return {
    type: 'nodes',
    count: result.items.length,
    rows: result.items.map((item) => renderItem(item, options)),
  };
}

/** The pipeline form: one match per line, and an error when nothing matched. */
export function xpathExtract(source: string, expression: string, options: QueryOptions = {}): string {
  const result = runXPathQuery(source, expression, options);
  if (result.type === 'nodes' && result.count === 0) {
    throw new Error(`Nothing matched "${expression}"`);
  }
  return result.rows.join('\n');
}

export const CSS_SAMPLE = `<!DOCTYPE html>
<html>
  <body>
    <ul class="products">
      <li class="item" data-sku="A-1"><a href="/p/1">Cast iron pan</a><span class="price">£39.00</span></li>
      <li class="item sale" data-sku="A-2"><a href="/p/2">Bread tin</a><span class="price">£12.50</span></li>
      <li class="item" data-sku="B-7"><a href="/p/3">Dough scraper</a><span class="price">£4.00</span></li>
    </ul>
  </body>
</html>`;

export const XPATH_SAMPLE = `<catalog>
  <book id="bk101" lang="en">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <price>44.95</price>
  </book>
  <book id="bk102" lang="en">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <price>5.95</price>
  </book>
  <book id="bk103" lang="fr">
    <author>Corets, Eva</author>
    <title>Maeve Ascendant</title>
    <price>5.95</price>
  </book>
</catalog>`;
