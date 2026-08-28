'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  LOCALES,
  type Locale,
  type NumberFormat,
  localeSeparators,
  losesPrecision,
  numberFormats,
  parseNumber,
} from './logic';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const GROUP_BLURB: Record<NumberFormat['group'], string> = {
  Locale: 'how this locale writes the number',
  Notation: 'the same value at a different scale',
  Radix: 'the integer in another base',
};

function FormatCard({ format }: { format: NumberFormat }) {
  return (
    <button
      onClick={() => format.available && copy(format.value)}
      title={format.available ? 'Click to copy' : format.note}
      className={`bg-white p-4 text-left transition-colors ${
        format.available ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
      }`}
    >
      <p className={`${labelClass} mb-1`}>{format.label}</p>
      <p
        className={`text-lg font-mono font-bold break-all leading-snug ${
          format.available ? 'text-gray-900' : 'text-gray-400'
        }`}
      >
        {format.value}
      </p>
      <p className="text-[11px] text-gray-400 mt-1">{format.note}</p>
    </button>
  );
}

export const NumberFormatAdvanced = () => {
  const [input, setInput] = useState('1234567.891');
  const [locale, setLocale] = useState<Locale>('en-US');

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) setInput(from);
    const loc = p.get('locale');
    if ((LOCALES as readonly string[]).includes(loc ?? '')) setLocale(loc as Locale);
  }, []);

  const result = useMemo(() => {
    if (!input.trim()) return { data: null, error: 'Enter a number to format' };
    try {
      const n = parseNumber(input);
      return {
        data: {
          n,
          formats: numberFormats(input, locale),
          separators: localeSeparators(locale),
          imprecise: losesPrecision(input, n),
        },
        error: null as string | null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Invalid number' };
    }
  }, [input, locale]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const groups: NumberFormat['group'][] = ['Locale', 'Notation', 'Radix'];

  return (
    <Panel
      title="Number Format Advanced"
      description="Type a number and see every way of writing it at once — grouped for a locale, [1 scientific 2], [1 engineering 2], [1 SI suffix 2], and binary, hex or octal when the value is a whole number. Click any result to copy it."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Number</label>
              <input
                className={inputClass}
                placeholder="1234567.891"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Locale</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-white text-gray-900 border border-gray-300 px-3 py-2 w-full text-sm focus:outline-none focus:border-gray-900"
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {result.error}
            </div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className="bg-gray-900 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {locale}
                </p>
                <p className="text-4xl font-black text-white leading-none break-all">
                  {data.n.toLocaleString(locale)}
                </p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  groups with &quot;{data.separators.group || 'nothing'}&quot; · decimal point is
                  &quot;{data.separators.decimal}&quot;
                </p>
              </div>

              {data.imprecise && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700 text-sm">
                  This value is past 2<sup>53</sup>, the largest integer a JavaScript number holds
                  exactly. Every line below is rounded to the nearest representable value.
                </div>
              )}

              {/* Formats, by group */}
              {groups.map((g) => {
                const formats = data.formats.filter((f) => f.group === g);
                return (
                  <div key={g}>
                    <p className={`${labelClass} mb-2`}>
                      {g}{' '}
                      <span className="normal-case font-normal text-gray-400">
                        ({GROUP_BLURB[g]})
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                      {formats.map((f) => (
                        <FormatCard key={f.label} format={f} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Same number, other locales */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Other Locales{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (click a row to switch)
                  </span>
                </p>
                <div className="border border-gray-200">
                  <table className="w-full">
                    <tbody>
                      {LOCALES.map((l) => (
                        <tr
                          key={l}
                          onClick={() => setLocale(l)}
                          className={`border-t border-gray-200 first:border-t-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                            l === locale ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono text-xs text-gray-500 w-24 whitespace-nowrap">
                            {l}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-sm text-gray-900 break-all">
                            {data.n.toLocaleString(l)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
