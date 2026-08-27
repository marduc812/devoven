// Pure TypeScript — no browser APIs, no DOMParser.

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * Convert XML string to JSON object.
 * Attributes become @attr fields, text content becomes _text field,
 * repeated sibling elements become arrays.
 */
export function xmlToJson(xml: string): string {
  const trimmed = xml.trim();
  if (!trimmed) return '';
  try {
    const result = parseXml(trimmed);
    return JSON.stringify(result, null, 2);
  } catch (e: unknown) {
    return 'Error: ' + (e instanceof Error ? e.message : String(e));
  }
}

/**
 * Convert JSON to XML string.
 * @attr fields become attributes, _text becomes text content, arrays become repeated elements.
 */
export function jsonToXml(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return 'Error: Invalid JSON';
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return 'Error: Expected a JSON object';
  }

  const obj = parsed as JsonObject;
  const keys = Object.keys(obj);
  if (keys.length === 0) return '<root/>';

  const rootKey = keys[0];
  const rootVal = obj[rootKey];
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + buildXmlElement(rootKey, rootVal, 0);
}

function buildXmlElement(tag: string, value: JsonValue, depth: number): string {
  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);

  if (value === null || value === undefined) {
    return `${indent}<${tag}/>`;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const escaped = escapeXml(String(value));
    return `${indent}<${tag}>${escaped}</${tag}>`;
  }

  if (Array.isArray(value)) {
    return value.map(item => buildXmlElement(tag, item, depth)).join('\n');
  }

  // Object case
  const obj = value as JsonObject;
  const attrs: string[] = [];
  const childElements: string[] = [];
  let textContent = '';

  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@')) {
      attrs.push(`${k.slice(1)}="${escapeXml(String(v))}"`);
    } else if (k === '_text') {
      textContent = escapeXml(String(v));
    } else if (Array.isArray(v)) {
      for (const item of v) {
        childElements.push(buildXmlElement(k, item, depth + 1));
      }
    } else {
      childElements.push(buildXmlElement(k, v, depth + 1));
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const openTag = `<${tag}${attrStr}>`;
  const closeTag = `</${tag}>`;

  if (textContent && childElements.length === 0) {
    return `${indent}${openTag}${textContent}${closeTag}`;
  }

  if (childElements.length === 0 && !textContent) {
    return `${indent}<${tag}${attrStr}/>`;
  }

  const children = childElements.join('\n');
  if (childElements.length > 0) {
    return `${indent}${openTag}\n${children}\n${indent}${closeTag}`;
  }

  return `${indent}${openTag}${textContent}${closeTag}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Simple recursive descent XML parser (no DOM, no browser APIs)
interface XmlToken {
  type: 'open' | 'close' | 'selfclose' | 'text' | 'processing' | 'comment' | 'cdata';
  name?: string;
  attrs?: Record<string, string>;
  text?: string;
}

function parseXml(xml: string): JsonObject {
  const tokens = tokenize(xml);
  let pos = 0;

  // Skip processing instructions and comments at top level
  while (pos < tokens.length && (tokens[pos].type === 'processing' || tokens[pos].type === 'comment')) {
    pos++;
  }

  if (pos >= tokens.length) throw new Error('No root element found');

  const token = tokens[pos];
  if (token.type === 'open') {
    pos++;
    const [result, newPos] = parseElement(tokens, pos, token);
    pos = newPos;
    return { [token.name!]: result };
  } else if (token.type === 'selfclose') {
    const attrs: JsonObject = {};
    for (const [k, v] of Object.entries(token.attrs || {})) {
      attrs['@' + k] = v;
    }
    return { [token.name!]: Object.keys(attrs).length > 0 ? attrs : null };
  }

  throw new Error('Unexpected token at root: ' + token.type);
}

function parseElement(tokens: XmlToken[], pos: number, openToken: XmlToken): [JsonValue, number] {
  const children: Record<string, JsonValue[]> = {};
  const attrs: Record<string, string> = openToken.attrs || {};
  let textParts: string[] = [];

  while (pos < tokens.length) {
    const token = tokens[pos];

    if (token.type === 'close') {
      pos++;
      break;
    }

    if (token.type === 'text' || token.type === 'cdata') {
      textParts.push(token.text || '');
      pos++;
      continue;
    }

    if (token.type === 'comment' || token.type === 'processing') {
      pos++;
      continue;
    }

    if (token.type === 'selfclose') {
      const childAttrs: JsonObject = {};
      for (const [k, v] of Object.entries(token.attrs || {})) {
        childAttrs['@' + k] = v;
      }
      const childVal: JsonValue = Object.keys(childAttrs).length > 0 ? childAttrs : null;
      if (!children[token.name!]) children[token.name!] = [];
      children[token.name!].push(childVal);
      pos++;
      continue;
    }

    if (token.type === 'open') {
      pos++;
      const [childResult, newPos] = parseElement(tokens, pos, token);
      pos = newPos;
      if (!children[token.name!]) children[token.name!] = [];
      children[token.name!].push(childResult);
      continue;
    }

    pos++;
  }

  const text = textParts.join('').trim();
  const hasChildren = Object.keys(children).length > 0;
  const hasAttrs = Object.keys(attrs).length > 0;

  if (!hasChildren && !hasAttrs) {
    return [text || '', pos];
  }

  const result: JsonObject = {};

  for (const [k, v] of Object.entries(attrs)) {
    result['@' + k] = v;
  }

  if (text) {
    result['_text'] = text;
  }

  for (const [k, vals] of Object.entries(children)) {
    result[k] = vals.length === 1 ? vals[0] : vals;
  }

  return [result, pos];
}

function tokenize(xml: string): XmlToken[] {
  const tokens: XmlToken[] = [];
  let i = 0;

  while (i < xml.length) {
    if (xml[i] === '<') {
      // Comment
      if (xml.startsWith('<!--', i)) {
        const end = xml.indexOf('-->', i + 4);
        if (end === -1) throw new Error('Unclosed comment');
        tokens.push({ type: 'comment', text: xml.slice(i + 4, end) });
        i = end + 3;
        continue;
      }

      // CDATA
      if (xml.startsWith('<![CDATA[', i)) {
        const end = xml.indexOf(']]>', i + 9);
        if (end === -1) throw new Error('Unclosed CDATA');
        tokens.push({ type: 'cdata', text: xml.slice(i + 9, end) });
        i = end + 3;
        continue;
      }

      // Processing instruction
      if (xml.startsWith('<?', i)) {
        const end = xml.indexOf('?>', i + 2);
        if (end === -1) throw new Error('Unclosed processing instruction');
        tokens.push({ type: 'processing', text: xml.slice(i + 2, end) });
        i = end + 2;
        continue;
      }

      // Close tag
      if (xml[i + 1] === '/') {
        const end = xml.indexOf('>', i + 2);
        if (end === -1) throw new Error('Unclosed close tag');
        const name = xml.slice(i + 2, end).trim();
        tokens.push({ type: 'close', name });
        i = end + 1;
        continue;
      }

      // Open or self-close tag
      const tagEnd = findTagEnd(xml, i + 1);
      if (tagEnd === -1) throw new Error('Unclosed tag');
      const tagContent = xml.slice(i + 1, tagEnd);
      const selfClose = tagContent.endsWith('/');
      const tagBody = selfClose ? tagContent.slice(0, -1).trim() : tagContent.trim();

      const { name, attrs } = parseTagAttrs(tagBody);

      if (selfClose) {
        tokens.push({ type: 'selfclose', name, attrs });
      } else {
        tokens.push({ type: 'open', name, attrs });
      }

      i = tagEnd + 1;
      continue;
    }

    // Text node
    const nextTag = xml.indexOf('<', i);
    const textEnd = nextTag === -1 ? xml.length : nextTag;
    const text = unescapeXml(xml.slice(i, textEnd));
    if (text.trim()) {
      tokens.push({ type: 'text', text });
    }
    i = textEnd;
  }

  return tokens;
}

function findTagEnd(xml: string, start: number): number {
  let inQuote: string | null = null;
  for (let i = start; i < xml.length; i++) {
    const c = xml[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === '>') {
      return i;
    }
  }
  return -1;
}

function parseTagAttrs(tagBody: string): { name: string; attrs: Record<string, string> } {
  const spaceIdx = tagBody.search(/\s/);
  if (spaceIdx === -1) return { name: tagBody, attrs: {} };

  const name = tagBody.slice(0, spaceIdx);
  const attrStr = tagBody.slice(spaceIdx + 1).trim();
  const attrs: Record<string, string> = {};

  const attrRegex = /(\S+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrStr)) !== null) {
    attrs[m[1]] = unescapeXml(m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4]);
  }

  return { name, attrs };
}

/**
 * Auto-detect whether input looks like XML or JSON.
 */
export function detectXmlOrJson(input: string): 'xml' | 'json' {
  const trimmed = input.trim();
  if (trimmed.startsWith('<')) return 'xml';
  return 'json';
}
