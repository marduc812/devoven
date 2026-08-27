import yaml from 'js-yaml';
import * as TOML from 'smol-toml';

import { emptyRecord } from '../safeObject';

// ─── YAML ↔ TOML ─────────────────────────────────────────────────────────────

export function yamlToToml(input: string): string {
  if (!input.trim()) return '';
  const obj = yaml.load(input);
  if (typeof obj !== 'object' || obj === null) throw new Error('YAML must represent an object');
  return TOML.stringify(obj as Record<string, unknown>);
}

export function tomlToYaml(input: string): string {
  if (!input.trim()) return '';
  const obj = TOML.parse(input);
  return yaml.dump(obj);
}

// ─── INI ↔ JSON ──────────────────────────────────────────────────────────────

export function iniToJson(input: string): string {
  if (!input.trim()) return '';
  const result = emptyRecord();
  let currentSection = result;

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      const currentSectionKey = line.slice(1, -1).trim();
      result[currentSectionKey] = emptyRecord();
      currentSection = result[currentSectionKey] as Record<string, unknown>;
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (val === 'true') currentSection[key] = true;
    else if (val === 'false') currentSection[key] = false;
    else if (!isNaN(Number(val)) && val !== '') currentSection[key] = Number(val);
    else currentSection[key] = val.replace(/^["']|["']$/g, '');
  }

  return JSON.stringify(result, null, 2);
}

export function jsonToIni(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  if (typeof obj !== 'object' || obj === null) throw new Error('Input must be a JSON object');

  const lines: string[] = [];
  const topLevel: [string, unknown][] = [];
  const sections: [string, Record<string, unknown>][] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sections.push([key, value as Record<string, unknown>]);
    } else {
      topLevel.push([key, value]);
    }
  }

  for (const [k, v] of topLevel) lines.push(`${k} = ${v}`);
  if (topLevel.length > 0 && sections.length > 0) lines.push('');

  for (const [section, vals] of sections) {
    lines.push(`[${section}]`);
    for (const [k, v] of Object.entries(vals)) lines.push(`${k} = ${v}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

// ─── Number Base Converter ────────────────────────────────────────────────────

export function convertBase(value: string, fromBase: number, toBase: number): string {
  if (!value.trim()) return '';
  const cleaned = value.trim().toLowerCase();
  const decimal = parseInt(cleaned, fromBase);
  if (isNaN(decimal)) throw new Error(`"${value}" is not a valid base-${fromBase} number`);
  return decimal.toString(toBase).toUpperCase();
}

export function getBaseLabel(base: number): string {
  const labels: Record<number, string> = {
    2: 'Binary',
    8: 'Octal',
    10: 'Decimal',
    16: 'Hexadecimal',
    32: 'Base32',
    36: 'Base36',
  };
  return labels[base] ?? `Base ${base}`;
}

// ─── JSON Flattener ───────────────────────────────────────────────────────────

export function flattenJson(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  const result: Record<string, unknown> = {};

  function flatten(current: unknown, prefix: string): void {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
        flatten(value, prefix ? `${prefix}.${key}` : key);
      }
    } else if (Array.isArray(current)) {
      current.forEach((item, i) => flatten(item, `${prefix}[${i}]`));
    } else {
      result[prefix] = current;
    }
  }

  flatten(obj, '');
  return JSON.stringify(result, null, 2);
}

export function unflattenJson(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  const result = emptyRecord();

  for (const [flatKey, value] of Object.entries(obj)) {
    const keys = flatKey.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) current[k] = emptyRecord();
      current = current[k] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
  }

  return JSON.stringify(result, null, 2);
}

// ─── Hex Dump ─────────────────────────────────────────────────────────────────

export type HexDumpEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'latin-1';

export const HEX_DUMP_ENCODINGS: Array<{ value: HexDumpEncoding; label: string }> = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
  { value: 'latin-1', label: 'Latin-1' },
];

/**
 * The bytes a string actually occupies under the given encoding.
 *
 * A dump has to work in bytes, not code units: "é" is one JS character but two
 * UTF-8 bytes, and "☃" is three. Latin-1 cannot represent anything above U+00FF,
 * so those characters become '?' the way a byte-oriented encoder would write them.
 */
export function encodeBytes(input: string, encoding: HexDumpEncoding = 'utf-8'): number[] {
  if (!input) return [];

  if (encoding === 'utf-8') {
    return Array.from(new TextEncoder().encode(input));
  }

  if (encoding === 'latin-1') {
    return Array.from(input, (char) => {
      const code = char.charCodeAt(0);
      return code > 0xff ? 0x3f : code;
    });
  }

  // UTF-16, one code unit at a time so surrogate pairs survive as their two units.
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const unit = input.charCodeAt(i);
    const high = (unit >> 8) & 0xff;
    const low = unit & 0xff;
    if (encoding === 'utf-16le') bytes.push(low, high);
    else bytes.push(high, low);
  }
  return bytes;
}

/** The character a byte prints as in the ASCII column, or '.' when it has none. */
export function byteToPrintable(byte: number): string {
  return byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.';
}

export type ByteClass = 'printable' | 'whitespace' | 'control' | 'high' | 'null';

/** Coarse grouping used to colour the dump, so structure stands out from text. */
export function classifyByte(byte: number): ByteClass {
  if (byte === 0) return 'null';
  if (byte === 9 || byte === 10 || byte === 13 || byte === 32) return 'whitespace';
  if (byte < 32 || byte === 127) return 'control';
  if (byte > 127) return 'high';
  return 'printable';
}

export interface HexDumpRow {
  /** Byte offset of the first byte on the row. */
  offset: number;
  /** The row's bytes; the last row may be short. */
  bytes: number[];
}

export function hexDumpRows(bytes: number[], bytesPerLine: number = 16): HexDumpRow[] {
  const rows: HexDumpRow[] = [];
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    rows.push({ offset: i, bytes: bytes.slice(i, i + bytesPerLine) });
  }
  return rows;
}

/** The classic `hexdump -C` rendering, for copying out as plain text. */
export function toHexDump(
  input: string,
  bytesPerLine: number = 16,
  encoding: HexDumpEncoding = 'utf-8',
): string {
  const bytes = encodeBytes(input, encoding);
  if (!bytes.length) return '';

  const gutter = Math.floor(bytesPerLine / 2);

  return hexDumpRows(bytes, bytesPerLine)
    .map((row) => {
      const offset = row.offset.toString(16).padStart(8, '0');

      const hexParts: string[] = [];
      const asciiParts: string[] = [];

      for (let j = 0; j < bytesPerLine; j++) {
        if (j < row.bytes.length) {
          hexParts.push(row.bytes[j].toString(16).padStart(2, '0'));
          asciiParts.push(byteToPrintable(row.bytes[j]));
        } else {
          hexParts.push('  ');
          asciiParts.push(' ');
        }
        if (gutter > 0 && j === gutter - 1) hexParts.push('');
      }

      return `${offset}  ${hexParts.join(' ')}  |${asciiParts.join('')}|`;
    })
    .join('\n');
}

// ─── Unicode Escape ───────────────────────────────────────────────────────────

export function encodeUnicodeEscapes(input: string): string {
  if (!input) return '';
  return [...input]
    .map((char) => {
      const code = char.codePointAt(0)!;
      if (code < 128) return char;
      if (code <= 0xffff) return `\\u${code.toString(16).padStart(4, '0')}`;
      return `\\U${code.toString(16).padStart(8, '0')}`;
    })
    .join('');
}

export function decodeUnicodeEscapes(input: string): string {
  if (!input) return '';
  return input
    .replace(/\\U([0-9a-fA-F]{8})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ─── Number Formatter ─────────────────────────────────────────────────────────

export function formatNumber(input: string, locale: string, decimals: number): string {
  if (!input.trim()) return '';
  const num = parseFloat(input.replace(/,/g, '').replace(/\s/g, ''));
  if (isNaN(num)) throw new Error('Invalid number');
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function unformatNumber(input: string): string {
  if (!input.trim()) return '';
  const cleaned = input.replace(/[^0-9.\-e]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) throw new Error('Cannot parse number');
  return n.toString();
}
