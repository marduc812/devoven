'use client';

import React, { useEffect, useMemo, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  yamlToToml,
  tomlToYaml,
  iniToJson,
  jsonToIni,
  convertBase,
  flattenJson,
  unflattenJson,
  toHexDump,
  encodeBytes,
  hexDumpRows,
  byteToPrintable,
  classifyByte,
  HEX_DUMP_ENCODINGS,
  type ByteClass,
  type HexDumpEncoding,
  encodeUnicodeEscapes,
  decodeUnicodeEscapes,
  formatNumber,
  unformatNumber,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

// ─── YAML to TOML ─────────────────────────────────────────────────────────────

export const YamlToToml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(yamlToToml(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid YAML or not an object' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="YAML to TOML Converter"
      description="Convert [1 YAML 2] to [1 TOML 2] format."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="YAML"
      toTitle="TOML"
      swapLink="/converting/toml-to-yaml"
      backColor="cyan"
    />
  );
};

// ─── TOML to YAML ─────────────────────────────────────────────────────────────

export const TomlToYaml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(tomlToYaml(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid TOML' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="TOML to YAML Converter"
      description="Convert [1 TOML 2] to [1 YAML 2] format."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="TOML"
      toTitle="YAML"
      swapLink="/converting/yaml-to-toml"
      backColor="cyan"
    />
  );
};

// ─── INI to JSON ─────────────────────────────────────────────────────────────

export const IniToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(iniToJson(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid INI' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="INI to JSON Converter"
      description="Convert [1 INI 2] configuration format to [1 JSON 2]. Supports sections, key=value pairs, and comments."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="INI"
      toTitle="JSON"
      swapLink="/converting/json-to-ini"
      backColor="cyan"
    />
  );
};

// ─── JSON to INI ─────────────────────────────────────────────────────────────

export const JsonToIni = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(jsonToIni(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid JSON' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON to INI Converter"
      description="Convert [1 JSON 2] to [1 INI 2] configuration format. Nested objects become sections."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON"
      toTitle="INI"
      swapLink="/converting/ini-to-json"
      backColor="cyan"
    />
  );
};

// ─── Number Base Converter ────────────────────────────────────────────────────

const BASE_OPTIONS = [2, 8, 10, 16, 32, 36];

const baseLabel = (base: number) => {
  const labels: Record<number, string> = {
    2: 'Binary (2)',
    8: 'Octal (8)',
    10: 'Decimal (10)',
    16: 'Hexadecimal (16)',
    32: 'Base32 (32)',
    36: 'Base36 (36)',
  };
  return labels[base] ?? `Base ${base}`;
};

export const NumberBaseConverter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(16);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(convertBase(fromValue, fromBase, toBase));
    } catch {
      setToValue(fromValue ? `Invalid base-${fromBase} number` : '');
    }
  }, [fromValue, fromBase, toBase]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">From</label>
        <select
          className={selectClass}
          value={fromBase}
          onChange={(e) => setFromBase(Number(e.target.value))}
        >
          {BASE_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {baseLabel(b)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">To</label>
        <select
          className={selectClass}
          value={toBase}
          onChange={(e) => setToBase(Number(e.target.value))}
        >
          {BASE_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {baseLabel(b)}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <AdvancedConverter
      title="Number Base Converter"
      description="Convert numbers between [1 binary 2], [1 octal 2], [1 decimal 2], [1 hex 2], and more."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Output"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};

// ─── JSON Flattener ───────────────────────────────────────────────────────────

export const JsonFlattener = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [direction, setDirection] = useState<'flatten' | 'unflatten'>('flatten');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(direction === 'flatten' ? flattenJson(fromValue) : unflattenJson(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid JSON' : '');
    }
  }, [fromValue, direction]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <div className="flex items-center gap-2">
      <label className="text-gray-400 text-xs whitespace-nowrap">Mode</label>
      <select
        className={selectClass}
        value={direction}
        onChange={(e) => setDirection(e.target.value as 'flatten' | 'unflatten')}
      >
        <option value="flatten">Flatten</option>
        <option value="unflatten">Unflatten</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="JSON Flattener"
      description="Flatten nested JSON to [1 dot-notation 2] keys, or unflatten back to a nested structure."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input JSON"
      toTitle="Output JSON"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};

// ─── Hex Dump ─────────────────────────────────────────────────────────────────

const hexDumpLabelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

// Tailwind classes rather than inline colours: globals.css already remaps the
// -700 shades and text-gray-900 for the dark theme, so the dump stays legible
// in both. Only the hover highlight is inline, and it sets text and background
// together so it does not depend on the theme.
const BYTE_CLASS_COLOR: Record<ByteClass, string> = {
  printable: 'text-gray-900',
  whitespace: 'text-sky-700',
  control: 'text-fuchsia-700',
  high: 'text-amber-700',
  null: 'text-gray-400',
};

const BYTE_CLASS_LABEL: Record<ByteClass, string> = {
  printable: 'printable ASCII',
  whitespace: 'space, tab, newline',
  control: 'control byte',
  high: 'non-ASCII (multi-byte)',
  null: 'null',
};

const HOVER_STYLE: React.CSSProperties = { backgroundColor: '#fde68a', color: '#111827' };

export const HexDump = () => {
  const [fromValue, setFromValue] = useState('Hello, World!');
  const [bytesPerLine, setBytesPerLine] = useState(16);
  const [encoding, setEncoding] = useState<HexDumpEncoding>('utf-8');
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from');
    if (from) setFromValue(from);
    const width = searchParams.get('width');
    if (width === '8' || width === '16' || width === '32') setBytesPerLine(Number(width));
    const enc = searchParams.get('encoding');
    if (HEX_DUMP_ENCODINGS.some((e) => e.value === enc)) setEncoding(enc as HexDumpEncoding);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: fromValue, width: bytesPerLine, encoding })

  const { bytes, rows, counts } = useMemo(() => {
    const b = encodeBytes(fromValue, encoding);
    const tally: Record<ByteClass, number> = {
      printable: 0,
      whitespace: 0,
      control: 0,
      high: 0,
      null: 0,
    };
    for (const byte of b) tally[classifyByte(byte)]++;
    return { bytes: b, rows: hexDumpRows(b, bytesPerLine), counts: tally };
  }, [fromValue, encoding, bytesPerLine]);

  // Only the classes actually present are worth a legend entry.
  const legend = (Object.keys(counts) as ByteClass[]).filter((k) => counts[k] > 0);
  const gutter = Math.floor(bytesPerLine / 2);
  const offsetWidth = Math.max(8, bytes.length.toString(16).length);

  const isHovered = (index: number) => hovered === index;
  const byteColor = (byte: number, index: number) =>
    isHovered(index) ? '' : BYTE_CLASS_COLOR[classifyByte(byte)];

  return (
    <Panel
      title="Hex Dump"
      description="Lay text out the way [1 hexdump -C 2] does: byte offset, the raw bytes in hex, and the printable characters beside them. Hovering a byte marks it in both columns. Counts real encoded bytes, so [1 é 2] shows as two under UTF-8, not one."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className={`${hexDumpLabelClass} block mb-1`}>Text Input</label>
            <textarea
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="Hello, World!"
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm resize-y"
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className={`${hexDumpLabelClass} block mb-1`}>Bytes Per Line</label>
              <div className="flex gap-1">
                {[8, 16, 32].map((w) => (
                  <button
                    key={w}
                    onClick={() => setBytesPerLine(w)}
                    className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                      bytesPerLine === w
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`${hexDumpLabelClass} block mb-1`}>Encoding</label>
              <select
                value={encoding}
                onChange={(e) => setEncoding(e.target.value as HexDumpEncoding)}
                className="bg-white text-gray-900 border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
              >
                {HEX_DUMP_ENCODINGS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(toHexDump(fromValue, bytesPerLine, encoding))
                  .catch(() => {});
              }}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              Copy Dump
            </button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
            {[
              { label: 'Bytes', value: bytes.length, hint: `as ${encoding}` },
              { label: 'Characters', value: [...fromValue].length, hint: 'code points' },
              { label: 'Rows', value: rows.length, hint: `${bytesPerLine} per row` },
              {
                label: 'Non-ASCII',
                value: counts.high,
                hint: 'bytes above 0x7F',
              },
            ].map((s) => (
              <div key={s.label} className="bg-white p-4">
                <p className={`${hexDumpLabelClass} mb-1`}>{s.label}</p>
                <p className="text-2xl font-black text-gray-900">{s.value.toLocaleString('en-US')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.hint}</p>
              </div>
            ))}
          </div>

          {/* The dump */}
          {bytes.length === 0 ? (
            <div className="border border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              Type something above to see its bytes.
            </div>
          ) : (
            <div>
              <p className={`${hexDumpLabelClass} mb-2`}>Dump</p>
              <div className="border border-gray-200 bg-white overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="font-mono text-sm border-separate border-spacing-0">
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.offset}>
                        <td className="px-3 py-1 text-gray-400 text-xs align-middle whitespace-nowrap select-none sticky left-0 bg-white">
                          {row.offset.toString(16).padStart(offsetWidth, '0')}
                        </td>
                        {Array.from({ length: bytesPerLine }, (_, j) => {
                          const index = row.offset + j;
                          const byte = row.bytes[j];
                          return (
                            <td
                              key={j}
                              onMouseEnter={() => byte !== undefined && setHovered(index)}
                              onMouseLeave={() => setHovered(null)}
                              className={`py-1 px-1 text-center align-middle ${
                                gutter > 0 && j === gutter ? 'pl-4' : ''
                              } ${byte === undefined ? '' : byteColor(byte, index)}`}
                              style={
                                byte !== undefined && isHovered(index) ? HOVER_STYLE : undefined
                              }
                            >
                              {byte === undefined ? '  ' : byte.toString(16).padStart(2, '0')}
                            </td>
                          );
                        })}
                        <td className="pl-4 pr-3 py-1 whitespace-pre align-middle">
                          <span className="text-gray-300 select-none">|</span>
                          {Array.from({ length: bytesPerLine }, (_, j) => {
                            const index = row.offset + j;
                            const byte = row.bytes[j];
                            if (byte === undefined) return <span key={j}> </span>;
                            return (
                              <span
                                key={j}
                                onMouseEnter={() => setHovered(index)}
                                onMouseLeave={() => setHovered(null)}
                                className={byteColor(byte, index)}
                                style={isHovered(index) ? HOVER_STYLE : undefined}
                              >
                                {byteToPrintable(byte)}
                              </span>
                            );
                          })}
                          <span className="text-gray-300 select-none">|</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                {legend.map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className={`font-mono text-xs normal-case ${BYTE_CLASS_COLOR[k]}`}>
                      ff
                    </span>
                    {BYTE_CLASS_LABEL[k]} ({counts[k]})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

// ─── Unicode Escape ───────────────────────────────────────────────────────────

export const UnicodeEscape = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(
        direction === 'encode' ? encodeUnicodeEscapes(fromValue) : decodeUnicodeEscapes(fromValue),
      );
    } catch {
      setToValue(fromValue ? 'Conversion error' : '');
    }
  }, [fromValue, direction]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <div className="flex items-center gap-2">
      <label className="text-gray-400 text-xs whitespace-nowrap">Direction</label>
      <select
        className={selectClass}
        value={direction}
        onChange={(e) => setDirection(e.target.value as 'encode' | 'decode')}
      >
        <option value="encode">Encode</option>
        <option value="decode">Decode</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Unicode Escape"
      description="Encode text to [1 \\uXXXX 2] escape sequences or decode them back to characters."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Output"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};

// ─── Number Formatter ─────────────────────────────────────────────────────────

const LOCALES = [
  { value: 'en-US', label: 'en-US (1,234.56)' },
  { value: 'en-GB', label: 'en-GB (1,234.56)' },
  { value: 'de-DE', label: 'de-DE (1.234,56)' },
  { value: 'fr-FR', label: 'fr-FR (1\u00a0234,56)' },
  { value: 'ja-JP', label: 'ja-JP (1,234.56)' },
];

const DECIMALS = [0, 2, 4];

export const NumberFormatter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [locale, setLocale] = useState('en-US');
  const [decimals, setDecimals] = useState(2);
  const [direction, setDirection] = useState<'format' | 'unformat'>('format');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      if (direction === 'format') {
        setToValue(formatNumber(fromValue, locale, decimals));
      } else {
        setToValue(unformatNumber(fromValue));
      }
    } catch {
      setToValue(fromValue ? 'Invalid number' : '');
    }
  }, [fromValue, locale, decimals, direction]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">Direction</label>
        <select
          className={selectClass}
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'format' | 'unformat')}
        >
          <option value="format">Format</option>
          <option value="unformat">Unformat</option>
        </select>
      </div>
      {direction === 'format' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs whitespace-nowrap">Locale</label>
            <select
              className={selectClass}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs whitespace-nowrap">Decimals</label>
            <select
              className={selectClass}
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
            >
              {DECIMALS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );

  return (
    <AdvancedConverter
      title="Number Formatter"
      description="Format numbers with [1 thousands separators 2], [1 decimal places 2], and locale-specific styles."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Number"
      toTitle="Formatted Output"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};
