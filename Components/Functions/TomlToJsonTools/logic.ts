// Pure TypeScript — no browser APIs, no React.
// Simple TOML parser: supports strings, integers, floats, booleans, datetimes,
// arrays, inline tables, and standard section tables.

import { emptyRecord } from '../safeObject';

type TomlValue =
  | string
  | number
  | boolean
  | null
  | TomlValue[]
  | { [key: string]: TomlValue };

function stripComment(line: string): string {
  // Remove inline comments, but not # inside strings
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
      if (ch === '#') return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

function parseTomlValue(raw: string): TomlValue {
  const s = raw.trim();

  // Boolean
  if (s === 'true') return true;
  if (s === 'false') return false;

  // Multiline strings — not supported, treated as error
  // Basic string
  if (s.startsWith('"') && s.endsWith('"')) {
    return s
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  // Literal string
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1);
  }

  // Array
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    const items = splitArrayItems(inner);
    return items.map((item) => parseTomlValue(item.trim()));
  }

  // Inline table
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    const obj = emptyRecord<TomlValue>();
    if (!inner) return obj;
    const pairs = splitArrayItems(inner);
    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const k = pair.slice(0, eqIdx).trim();
      const v = pair.slice(eqIdx + 1).trim();
      obj[k] = parseTomlValue(v);
    }
    return obj;
  }

  // Datetime (ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;

  // Float
  if (/^-?(\d[\d_]*\.[\d_]*|\d[\d_]*[eE][+-]?\d+|inf|nan)$/.test(s)) {
    return parseFloat(s.replace(/_/g, ''));
  }

  // Hex/Oct/Bin integers
  if (/^0x[\da-fA-F_]+$/.test(s)) return parseInt(s.replace(/_/g, ''), 16);
  if (/^0o[0-7_]+$/.test(s)) return parseInt(s.slice(2).replace(/_/g, ''), 8);
  if (/^0b[01_]+$/.test(s)) return parseInt(s.slice(2).replace(/_/g, ''), 2);

  // Integer
  if (/^-?\d[\d_]*$/.test(s)) return parseInt(s.replace(/_/g, ''), 10);

  throw new Error('Cannot parse TOML value: ' + s);
}

function splitArrayItems(s: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let inStr = false;
  let strChar = '';
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
      if (ch === '[' || ch === '{') { depth++; continue; }
      if (ch === ']' || ch === '}') { depth--; continue; }
      if (ch === ',' && depth === 0) {
        items.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
  }
  const last = s.slice(start).trim();
  if (last) items.push(last);
  return items;
}

function getOrCreate(obj: { [key: string]: TomlValue }, key: string): { [key: string]: TomlValue } {
  if (!(key in obj)) obj[key] = emptyRecord<TomlValue>();
  const val = obj[key];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    return val as { [key: string]: TomlValue };
  }
  throw new Error('Key conflict: ' + key);
}

function setNestedKey(
  obj: { [key: string]: TomlValue },
  keys: string[],
  value: TomlValue,
): void {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = getOrCreate(current, keys[i]);
  }
  current[keys[keys.length - 1]] = value;
}

export function tomlToJson(input: string): string {
  if (!input.trim()) return '';

  const root = emptyRecord<TomlValue>();
  let currentObj = root;
  let currentPath: string[] = [];
  let isArrayTable = false;
  const arrayTableCounters = emptyRecord<number>();

  const lines = input.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = stripComment(lines[i]).trim();
    if (!line) continue;

    // Array of tables [[section]]
    if (line.startsWith('[[') && line.endsWith(']]')) {
      const path = line.slice(2, -2).trim().split('.');
      const pathKey = path.join('.');
      isArrayTable = true;
      currentPath = path;

      // Navigate to parent
      let parent = root;
      for (let j = 0; j < path.length - 1; j++) {
        parent = getOrCreate(parent, path[j]);
      }
      const lastKey = path[path.length - 1];
      if (!(lastKey in parent)) parent[lastKey] = [];
      const arr = parent[lastKey] as TomlValue[];
      const newObj = emptyRecord<TomlValue>();
      arr.push(newObj);
      currentObj = newObj;
      arrayTableCounters[pathKey] = (arrayTableCounters[pathKey] || 0) + 1;
      continue;
    }

    // Table header [section]
    if (line.startsWith('[') && line.endsWith(']')) {
      isArrayTable = false;
      const path = line.slice(1, -1).trim().split('.');
      currentPath = path;

      // Navigate/create nested objects
      currentObj = root;
      for (const key of path) {
        if (key in currentObj) {
          const v = currentObj[key];
          if (Array.isArray(v)) {
            // Use last element of array table
            currentObj = v[v.length - 1] as { [key: string]: TomlValue };
          } else if (typeof v === 'object' && v !== null) {
            currentObj = v as { [key: string]: TomlValue };
          } else {
            throw new Error('Key conflict on table: ' + key);
          }
        } else {
          const newObj = emptyRecord<TomlValue>();
          currentObj[key] = newObj;
          currentObj = newObj;
        }
      }
      continue;
    }

    // Key = value
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const rawKey = line.slice(0, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    // Handle dotted keys
    const keys = rawKey.split('.').map((k) => k.trim().replace(/^["']|["']$/g, ''));
    const value = parseTomlValue(rawVal);

    if (keys.length === 1) {
      currentObj[keys[0]] = value;
    } else {
      // Navigate into currentObj for dotted key
      let obj = currentObj;
      for (let ki = 0; ki < keys.length - 1; ki++) {
        obj = getOrCreate(obj, keys[ki]);
      }
      obj[keys[keys.length - 1]] = value;
    }
  }

  return JSON.stringify(root, null, 2);
}
