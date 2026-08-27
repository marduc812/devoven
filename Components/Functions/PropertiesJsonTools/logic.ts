// Pure TypeScript — no browser APIs.

/**
 * Parse Java .properties file to JSON string.
 * Supports: key=value, key: value, # comments, ! comments,
 * multiline with \, unicode escapes \uXXXX.
 */
export function propertiesToJson(input: string): string {
  const obj: Record<string, string> = {};
  const lines = input.split(/\r?\n/);

  let currentKey = '';
  let currentVal = '';
  let continuation = false;

  for (const line of lines) {
    if (continuation) {
      const trimmed = line.trimStart();
      if (trimmed.endsWith('\\') && !trimmed.endsWith('\\\\')) {
        currentVal += trimmed.slice(0, -1);
      } else {
        currentVal += trimmed;
        obj[currentKey] = unescapeProperties(currentVal);
        currentKey = '';
        currentVal = '';
        continuation = false;
      }
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

    // Find separator: = or : or whitespace
    const sepMatch = trimmed.match(/^([^=:\s]+)\s*[=:]\s*(.*)$/) ||
                     trimmed.match(/^([^=:\s]+)\s+(.*)$/);
    if (!sepMatch) {
      // key with no value
      obj[trimmed] = '';
      continue;
    }

    const key = unescapeProperties(sepMatch[1]);
    const val = sepMatch[2];

    if (val.endsWith('\\') && !val.endsWith('\\\\')) {
      currentKey = key;
      currentVal = val.slice(0, -1);
      continuation = true;
    } else {
      obj[key] = unescapeProperties(val);
    }
  }

  // Flush any remaining continuation
  if (continuation && currentKey) {
    obj[currentKey] = unescapeProperties(currentVal);
  }

  return JSON.stringify(obj, null, 2);
}

function unescapeProperties(val: string): string {
  // Process unicode escapes first
  let result = val.replace(/\\u([0-9A-Fa-f]{4})/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  result = result
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\!/g, '!')
    .replace(/\\#/g, '#')
    .replace(/\\\\/g, '\\');
  return result;
}

/**
 * Convert JSON object to .properties file format.
 */
export function jsonToProperties(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return 'Error: Invalid JSON';
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'Error: Expected a JSON object (not array)';
  }

  const obj = parsed as Record<string, unknown>;
  return Object.entries(obj)
    .map(([k, v]) => {
      const escapedKey = escapeKey(k);
      const escapedVal = escapeValue(String(v === null || v === undefined ? '' : v));
      return `${escapedKey}=${escapedVal}`;
    })
    .join('\n');
}

function escapeKey(key: string): string {
  return key
    .replace(/\\/g, '\\\\')
    .replace(/\s/g, '\\ ')
    .replace(/=/g, '\\=')
    .replace(/:/g, '\\:')
    .replace(/#/g, '\\#')
    .replace(/!/g, '\\!');
}

function escapeValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Auto-detect whether input looks like .properties or JSON.
 */
export function detectPropertiesOrJson(input: string): 'properties' | 'json' {
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'properties';
}
