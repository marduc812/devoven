// Pure TypeScript — no browser APIs.

import { emptyRecord } from '../safeObject';

export type IniSection = Record<string, string>;
export type IniData = Record<string, IniSection>;

/**
 * Parse an INI/config file string into a JSON object.
 * Rules:
 *   - Lines beginning with ; or # are comments (skipped).
 *   - [section] headers create nested objects.
 *   - key = value  or  key : value  pairs.
 *   - Quoted values (single or double) have their quotes stripped.
 *   - Keys before any section go into the "__root__" namespace.
 */
export function parseIni(input: string): IniData {
  const result: IniData = emptyRecord<IniSection>();
  let currentSection = '__root__';
  result[currentSection] = emptyRecord<string>();

  const lines = input.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;

    // Section header
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!result[currentSection]) result[currentSection] = emptyRecord<string>();
      continue;
    }

    // Key-value pair (= or :)
    const kvMatch = line.match(/^([^=:]+)[=:](.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2].trim();

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Remove inline comments (anything after ; or # that isn't in a quoted value)
      const commentIdx = value.search(/\s[;#]/);
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx).trim();
      }

      result[currentSection][key] = value;
    }
  }

  // Remove __root__ if empty
  if (Object.keys(result['__root__']).length === 0) {
    delete result['__root__'];
  }

  return result;
}

/**
 * Convert a JSON object (matching the structure from parseIni) back to INI format.
 * Flat values are placed in the root section; object values become [sections].
 */
export function jsonToIni(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return 'Error: Invalid JSON';
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'Error: Expected a JSON object';
  }

  const obj = parsed as Record<string, unknown>;
  const lines: string[] = [];

  // Root-level scalar values first
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val !== 'object' || val === null) {
      lines.push(`${key} = ${val}`);
    }
  }

  // Nested objects become sections
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push('');
      lines.push(`[${key}]`);
      const section = val as Record<string, unknown>;
      for (const k of Object.keys(section)) {
        lines.push(`${k} = ${section[k]}`);
      }
    }
  }

  return lines.join('\n').trim();
}

export function iniToJson(input: string): string {
  try {
    const parsed = parseIni(input);
    return JSON.stringify(parsed, null, 2);
  } catch (err: unknown) {
    return 'Error: ' + (err instanceof Error ? err.message : String(err));
  }
}
