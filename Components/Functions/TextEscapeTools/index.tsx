'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  escapeHtml,
  unescapeHtml,
  escapeRegex,
  escapeJson,
  unescapeJson,
  escapeSql,
  escapeShell,
  escapeCsv,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

type Context = 'html' | 'json' | 'regex' | 'sql' | 'shell' | 'csv';
type Direction = 'escape' | 'unescape';

function convert(text: string, context: Context, direction: Direction): string {
  if (!text) return '';
  try {
    if (context === 'html') return direction === 'escape' ? escapeHtml(text) : unescapeHtml(text);
    if (context === 'json') return direction === 'escape' ? escapeJson(text) : unescapeJson(text);
    if (context === 'regex') return escapeRegex(text); // unescape not meaningful for regex
    if (context === 'sql') return escapeSql(text); // SQL unescape: remove double-quotes not standard
    if (context === 'shell') return escapeShell(text);
    if (context === 'csv') return escapeCsv(text);
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
  return text;
}

export function TextEscape() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [context, setContext] = useState<Context>('html');
  const [direction, setDirection] = useState<Direction>('escape');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const ctx = params.get('context') as Context;
    if (ctx) setContext(ctx);
    const dir = params.get('direction') as Direction;
    if (dir) setDirection(dir);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ context, direction })

  useEffect(() => {
    setOutput(convert(input, context, direction));
  }, [input, context, direction]);

  const supportsUnescape = context === 'html' || context === 'json';

  return (
    <AdvancedConverter
      title="Text Escape / Unescape"
      description="Escape and unescape text for different contexts: HTML, JSON, Regex, SQL, Shell, and CSV. For example, [1 <div>Hello & World</div> 2] escaped for HTML becomes [1 &lt;div&gt;Hello &amp; World&lt;/div&gt; 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as Context)}
            className={selectClass}
          >
            <option value="html">HTML</option>
            <option value="json">JSON</option>
            <option value="regex">Regex</option>
            <option value="sql">SQL</option>
            <option value="shell">Shell</option>
            <option value="csv">CSV</option>
          </select>
          {supportsUnescape && (
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
              className={selectClass}
            >
              <option value="escape">Escape</option>
              <option value="unescape">Unescape</option>
            </select>
          )}
        </div>
      }
    />
  );
}
