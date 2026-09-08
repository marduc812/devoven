'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  runCssQuery,
  runXPathQuery,
  CSS_SAMPLE,
  XPATH_SAMPLE,
  type MarkupMode,
  type QueryOutput,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 font-mono';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

const OUTPUTS: { value: QueryOutput; label: string }[] = [
  { value: 'text', label: 'Text content' },
  { value: 'markup', label: 'Matched markup' },
  { value: 'attribute', label: 'One attribute' },
  { value: 'path', label: 'Path to the node' },
  { value: 'json', label: 'JSON' },
];

const isOutput = (value: string | null): value is QueryOutput =>
  OUTPUTS.some((o) => o.value === value);

// ─── CSS Selector Extractor ───────────────────────────────────────────────────

export function CssSelectorExtractor() {
  const [input, setInput] = useState('');
  const [selector, setSelector] = useState('');
  const [output, setOutput] = useState<QueryOutput>('text');
  const [attribute, setAttribute] = useState('href');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const q = params.get('selector');
    if (q) setSelector(q);
    const out = params.get('output');
    if (isOutput(out)) setOutput(out);
    const attr = params.get('attribute');
    if (attr) setAttribute(attr);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ selector, output, attribute: output === 'attribute' ? attribute : null });

  const { result, error } = useMemo(() => {
    if (!input.trim() || !selector.trim()) return { result: null, error: '' };
    try {
      return { result: runCssQuery(input, selector, { mode: 'html', output, attribute }), error: '' };
    } catch (e: unknown) {
      return { result: null, error: e instanceof Error ? e.message : 'Invalid selector' };
    }
  }, [input, selector, output, attribute]);

  const toValue = error
    ? `Error: ${error}`
    : result === null
      ? ''
      : result.count === 0
        ? 'No matches.'
        : result.rows.join('\n');

  return (
    <AdvancedConverter
      title="CSS Selector Extractor"
      description="Run a CSS selector over a page and keep what it matches. Supports type, id, class and attribute selectors, all four combinators, selector lists, the structural pseudo-classes, [1 :not() 2], [1 :is() 2] and [1 :has() 2], plus a non-standard [1 :contains() 2]. Nothing is fetched: the HTML is the one you paste."
      fromValue={input}
      toValue={toValue}
      setFromValue={setInput}
      fromTitle="HTML"
      toTitle={result && !error ? `${result.count} Match${result.count === 1 ? '' : 'es'}` : 'Matches'}
      backColor="lime"
      extraElements={
        <>
          <div className="flex items-center gap-2 grow min-w-[240px]">
            <label className={labelClass}>Selector</label>
            <input
              className={`${inputClass} grow`}
              placeholder="ul.products li.item a"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Show</label>
            <select className={selectClass} value={output} onChange={(e) => setOutput(e.target.value as QueryOutput)}>
              {OUTPUTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {output === 'attribute' && (
            <div className="flex items-center gap-2">
              <label className={labelClass}>Attribute</label>
              <input
                className={`${inputClass} w-32`}
                value={attribute}
                onChange={(e) => setAttribute(e.target.value)}
              />
            </div>
          )}
          <button
            className={buttonClass}
            onClick={() => { setInput(CSS_SAMPLE); setSelector('li.item a'); }}
          >
            Load Sample
          </button>
        </>
      }
    />
  );
}

// ─── XPath Evaluator ──────────────────────────────────────────────────────────

export function XPathEvaluator() {
  const [input, setInput] = useState('');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<MarkupMode>('xml');
  const [output, setOutput] = useState<QueryOutput>('text');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const q = params.get('xpath');
    if (q) setExpression(q);
    const m = params.get('mode');
    if (m === 'xml' || m === 'html') setMode(m);
    const out = params.get('output');
    if (isOutput(out)) setOutput(out);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ xpath: expression, mode, output });

  const { result, error } = useMemo(() => {
    if (!input.trim() || !expression.trim()) return { result: null, error: '' };
    try {
      return { result: runXPathQuery(input, expression, { mode, output }), error: '' };
    } catch (e: unknown) {
      return { result: null, error: e instanceof Error ? e.message : 'Invalid expression' };
    }
  }, [input, expression, mode, output]);

  const toValue = error
    ? `Error: ${error}`
    : result === null
      ? ''
      : result.type === 'nodes' && result.count === 0
        ? 'No matches.'
        : result.rows.join('\n');

  const title = !result || error
    ? 'Result'
    : result.type === 'nodes'
      ? `${result.count} Match${result.count === 1 ? '' : 'es'}`
      : `Result (${result.type})`;

  return (
    <AdvancedConverter
      title="XPath Evaluator"
      description="Evaluate an XPath expression against XML or HTML. Location paths, the common axes, predicates such as [1 //book[@lang='en'] 2], and the string, boolean and node functions: [1 contains() 2], [1 starts-with() 2], [1 normalize-space() 2], [1 count() 2], [1 not() 2], [1 position() 2] and [1 last() 2]. Namespaces are ignored, so match on the local name."
      fromValue={input}
      toValue={toValue}
      setFromValue={setInput}
      fromTitle={mode === 'xml' ? 'XML' : 'HTML'}
      toTitle={title}
      backColor="lime"
      extraElements={
        <>
          <div className="flex items-center gap-2 grow min-w-[240px]">
            <label className={labelClass}>XPath</label>
            <input
              className={`${inputClass} grow`}
              placeholder="//book[price > 10]/title"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Parse as</label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as MarkupMode)}>
              <option value="xml">XML</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Show</label>
            <select className={selectClass} value={output} onChange={(e) => setOutput(e.target.value as QueryOutput)}>
              {OUTPUTS.filter((o) => o.value !== 'attribute').map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            className={buttonClass}
            onClick={() => { setInput(XPATH_SAMPLE); setExpression('//book[price > 10]/title'); setMode('xml'); }}
          >
            Load Sample
          </button>
        </>
      }
    />
  );
}
