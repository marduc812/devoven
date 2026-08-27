import jsYaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// All functions in this file are pure (no React, no browser APIs).
// Lazy-loaded tools (prettier/standalone, sql-formatter) are NOT imported here
// — they are dynamic-imported inside component useEffects.

// ─── JSON Formatter ──────────────────────────────────────────────────────────

/**
 * Parses and re-serialises JSON with the given indentation.
 * Returns '' for blank input. Throws on invalid JSON.
 */
export function formatJson(input: string, indent: number): string {
  if (!input.trim()) return '';
  const parsed = JSON.parse(input); // throws SyntaxError on invalid input
  return JSON.stringify(parsed, null, indent);
}

/**
 * Validates JSON and returns a result object.
 * `error` contains the message from SyntaxError when invalid.
 */
export function validateJson(input: string): { valid: boolean; error?: string } {
  if (!input.trim()) return { valid: true };
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

// ─── XML Formatter ───────────────────────────────────────────────────────────

/**
 * Parses XML and rebuilds it with the given indentation.
 * Uses fast-xml-parser (CJS, Jest-compatible).
 * Returns '' for blank input. Throws on invalid XML.
 */
export function formatXml(input: string, indent: number): string {
  if (!input.trim()) return '';
  const indentStr = ' '.repeat(indent);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    parseTagValue: false,
  });
  const obj = parser.parse(input);
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: indentStr,
  });
  const result = builder.build(obj) as string;
  // Ensure XML declaration is present
  if (!result.trimStart().startsWith('<?xml')) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${result}`;
  }
  return result;
}

// ─── HTML Minifier ────────────────────────────────────────────────────────────
// (Formatter uses prettier/standalone — lazy-loaded in the component.)

/**
 * Collapses whitespace between HTML tags and trims the result.
 * Suitable as a lightweight minifier; not a full AST-based minifier.
 */
export function minifyHtml(input: string): string {
  if (!input.trim()) return '';
  return input
    .replace(/>\s+</g, '><')         // remove whitespace between tags
    .replace(/\s{2,}/g, ' ')         // collapse multiple spaces
    .replace(/\n/g, '')              // remove newlines
    .trim();
}

// ─── CSS Formatter / Minifier ────────────────────────────────────────────────
// (Formatter uses prettier/standalone — lazy-loaded in the component.)

/**
 * Removes CSS comments and collapses whitespace for minification.
 */
export function minifyCss(input: string): string {
  if (!input.trim()) return '';
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip /* ... */ comments
    .replace(/\s*([{};:,])\s*/g, '$1') // remove spaces around structural chars
    .replace(/\s{2,}/g, ' ')           // collapse remaining spaces
    .replace(/\n/g, '')                // remove newlines
    .trim();
}

// ─── JS Formatter / Minifier ─────────────────────────────────────────────────
// (Formatter uses prettier/standalone — lazy-loaded in the component.)

/**
 * Strips JS single-line and block comments, then collapses whitespace.
 * This is a simple, non-AST approach — sufficient for basic minification.
 */
export function minifyJs(input: string): string {
  if (!input.trim()) return '';
  return input
    .replace(/\/\/[^\n]*/g, '')        // strip // comments
    .replace(/\/\*[\s\S]*?\*\//g, '')  // strip /* ... */ comments
    .replace(/\s{2,}/g, ' ')           // collapse multiple spaces
    .replace(/\n/g, ' ')              // flatten newlines
    .trim();
}

// ─── YAML Validator ──────────────────────────────────────────────────────────

/**
 * Parses the input with js-yaml.
 * On success returns { valid: true, canonical: <re-dumped YAML> }.
 * On failure returns { valid: false, error: <message> }.
 */
export function validateYaml(input: string): {
  valid: boolean;
  canonical?: string;
  error?: string;
} {
  if (!input.trim()) return { valid: true, canonical: '' };
  try {
    const parsed = jsYaml.load(input);
    const canonical = jsYaml.dump(parsed, { indent: 2 });
    return { valid: true, canonical };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

// ─── Regex Tester ────────────────────────────────────────────────────────────

/**
 * Builds a RegExp from `pattern` and `flags`, runs it against `text`,
 * and returns all matches (with their indices when not using global flag).
 * Returns { error } if the pattern is invalid.
 */
export function getRegexMatches(
  pattern: string,
  flags: string,
  text: string,
): { matches: string[]; count: number; error?: string } {
  if (!pattern) return { matches: [], count: 0 };
  try {
    const re = new RegExp(pattern, flags);
    const matches: string[] = [];
    if (flags.includes('g')) {
      let m: RegExpExecArray | null;
      // Reset lastIndex to avoid infinite loops on zero-width matches
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        matches.push(m[0]);
        // Guard against infinite loop on zero-length match
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = re.exec(text);
      if (m) matches.push(m[0]);
    }
    return { matches, count: matches.length };
  } catch (e: any) {
    return { matches: [], count: 0, error: e.message };
  }
}

/**
 * Returns human-readable explanations for each regex flag character.
 */
export function explainRegexFlags(flags: string): string[] {
  const explanations: Record<string, string> = {
    g: 'g — Global: find all matches, not just the first',
    i: 'i — Case-insensitive: match upper and lower case',
    m: 'm — Multiline: ^ and $ match start/end of each line',
    s: 's — Dotall: . matches newline characters too',
    u: 'u — Unicode: enable full Unicode matching',
    y: 'y — Sticky: match only from lastIndex position',
  };
  return flags
    .split('')
    .filter((f) => f in explanations)
    .map((f) => explanations[f]);
}
