// ─── A tiny document tree for XPath and CSS ──────────────────────────────────
// The browser has DOMParser, but the tool logic has to be importable and
// testable outside a browser, so the tree is built here instead. It is small on
// purpose: enough structure to select against, not a conforming HTML parser.

export type NodeKind = 'element' | 'text' | 'comment' | 'cdata';

export type MarkupNode = {
  kind: NodeKind;
  /** Element name as written, lowercased in HTML mode. Empty for other kinds. */
  name: string;
  attributes: Record<string, string>;
  children: MarkupNode[];
  parent: MarkupNode | null;
  /** Text, comment or CDATA content. Empty for elements. */
  value: string;
};

export type MarkupMode = 'html' | 'xml';

/** Elements HTML closes for you, so `<br>` never swallows the rest of the page. */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** Elements whose content is text, not markup. */
const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);

function makeNode(kind: NodeKind, name = '', value = ''): MarkupNode {
  return { kind, name, attributes: {}, children: [], parent: null, value };
}

function append(parent: MarkupNode, child: MarkupNode): void {
  child.parent = parent;
  parent.children.push(child);
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return whole;
      }
    }
    return ENTITIES[body] ?? whole;
  });
}

const ATTR_PATTERN = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttributes(source: string, lowercase: boolean): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(ATTR_PATTERN)) {
    const name = lowercase ? match[1].toLowerCase() : match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (!(name in attributes)) attributes[name] = decodeEntities(value);
  }
  return attributes;
}

/**
 * Builds the tree. Unclosed tags are closed at the end of their parent rather
 * than treated as an error: real pages have them, and a selector still works.
 */
export function parseMarkup(source: string, mode: MarkupMode = 'html'): MarkupNode {
  const lowercase = mode === 'html';
  const root = makeNode('element', '#document');
  const stack: MarkupNode[] = [root];
  const top = () => stack[stack.length - 1];

  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf('<', i);
    if (lt === -1) {
      const text = source.slice(i);
      if (text.trim()) append(top(), makeNode('text', '', decodeEntities(text)));
      break;
    }
    if (lt > i) {
      const text = source.slice(i, lt);
      if (text.trim()) append(top(), makeNode('text', '', decodeEntities(text)));
    }

    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      const stop = end === -1 ? source.length : end + 3;
      append(top(), makeNode('comment', '', source.slice(lt + 4, end === -1 ? source.length : end)));
      i = stop;
      continue;
    }

    if (source.startsWith('<![CDATA[', lt)) {
      const end = source.indexOf(']]>', lt + 9);
      const stop = end === -1 ? source.length : end + 3;
      append(top(), makeNode('cdata', '', source.slice(lt + 9, end === -1 ? source.length : end)));
      i = stop;
      continue;
    }

    if (source.startsWith('<!', lt) || source.startsWith('<?', lt)) {
      const end = source.indexOf('>', lt);
      i = end === -1 ? source.length : end + 1;
      continue;
    }

    const close = source.slice(lt).match(/^<\/\s*([^\s>]+)\s*>/);
    if (close) {
      const name = lowercase ? close[1].toLowerCase() : close[1];
      // Close the nearest matching ancestor, and everything left open inside it.
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if (stack[depth].name === name) {
          stack.length = depth;
          break;
        }
      }
      i = lt + close[0].length;
      continue;
    }

    const open = source.slice(lt).match(/^<([a-zA-Z_][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/);
    if (!open) {
      // A bare `<` that starts nothing. Keep it as text.
      append(top(), makeNode('text', '', '<'));
      i = lt + 1;
      continue;
    }

    const name = lowercase ? open[1].toLowerCase() : open[1];
    const rest = open[2];
    const selfClosing = /\/\s*$/.test(rest);
    const element = makeNode('element', name);
    element.attributes = parseAttributes(rest.replace(/\/\s*$/, ''), lowercase);
    append(top(), element);
    i = lt + open[0].length;

    if (selfClosing || (lowercase && VOID_ELEMENTS.has(name))) continue;

    if (lowercase && RAW_TEXT_ELEMENTS.has(name)) {
      const closing = new RegExp(`</${name}\\s*>`, 'i');
      const remainder = source.slice(i);
      const found = remainder.search(closing);
      const body = found === -1 ? remainder : remainder.slice(0, found);
      if (body) append(element, makeNode('text', '', body));
      i = found === -1 ? source.length : i + found + remainder.slice(found).match(closing)![0].length;
      continue;
    }

    stack.push(element);
  }

  return root;
}

/** Every element under `node`, in document order, excluding `node` itself. */
export function descendantElements(node: MarkupNode): MarkupNode[] {
  const out: MarkupNode[] = [];
  const walk = (current: MarkupNode) => {
    for (const child of current.children) {
      if (child.kind !== 'element') continue;
      out.push(child);
      walk(child);
    }
  };
  walk(node);
  return out;
}

/** The concatenated text of a node and everything under it. */
export function textContent(node: MarkupNode): string {
  if (node.kind === 'text' || node.kind === 'cdata') return node.value;
  if (node.kind === 'comment') return '';
  return node.children.map(textContent).join('');
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

function escapeText(text: string): string {
  return text.replace(/[&<>]/g, (c) => ESCAPES[c]);
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"]/g, (c) => (c === '"' ? '&quot;' : ESCAPES[c]));
}

/** Serializes a node back to markup, which is what the tool shows for a match. */
export function serialize(node: MarkupNode, mode: MarkupMode = 'html'): string {
  if (node.kind === 'text') return escapeText(node.value);
  if (node.kind === 'cdata') return `<![CDATA[${node.value}]]>`;
  if (node.kind === 'comment') return `<!--${node.value}-->`;
  if (node.name === '#document') return node.children.map((c) => serialize(c, mode)).join('');

  const attributes = Object.entries(node.attributes)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('');
  const open = `<${node.name}${attributes}`;

  if (mode === 'html' && VOID_ELEMENTS.has(node.name)) return `${open}>`;
  if (node.children.length === 0) {
    return mode === 'xml' ? `${open}/>` : `${open}></${node.name}>`;
  }
  const inner = node.children.map((c) => serialize(c, mode)).join('');
  return `${open}>${inner}</${node.name}>`;
}

/** A `body > div.card > a` style path, for pointing at where a match sits. */
export function nodePath(node: MarkupNode): string {
  const parts: string[] = [];
  let current: MarkupNode | null = node;
  while (current && current.name !== '#document') {
    if (current.kind === 'element') {
      const siblings = (current.parent?.children ?? []).filter(
        (c) => c.kind === 'element' && c.name === current!.name,
      );
      const index = siblings.indexOf(current) + 1;
      parts.unshift(siblings.length > 1 ? `${current.name}[${index}]` : current.name);
    }
    current = current.parent;
  }
  return '/' + parts.join('/');
}
