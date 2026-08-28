'use client';

import React, { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatJson, validateJson, formatXml, minifyHtml, minifyCss, minifyJs, validateYaml, getRegexMatches, explainRegexFlags } from './logic';

// ─── JSON Formatter ──────────────────────────────────────────────────────────

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const ind = params.get('indent');
    if (ind && ['2', '4'].includes(ind)) setIndent(ind);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const validation = validateJson(input);
    if (!validation.valid) {
      setOutput(`Error: ${validation.error ?? 'Invalid JSON'}`);
      return;
    }
    try {
      setOutput(formatJson(input, parseInt(indent, 10)));
    } catch (e: any) {
      setOutput('Error: ' + e.message);
    }
  }, [input, indent]);

  const extraElements = (
    <select
      value={indent}
      onChange={(e) => setIndent(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="2">2 spaces</option>
      <option value="4">4 spaces</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="JSON Formatter & Validator"
      description="Format and validate JSON. Paste any JSON and get a pretty-printed, indented result. Invalid JSON shows the exact error. For example, [1 {&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30} 2] becomes a readable multi-line structure."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input JSON"
      toTitle="Formatted JSON"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── XML Formatter ───────────────────────────────────────────────────────────

export function XmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const ind = params.get('indent');
    if (ind && ['2', '4'].includes(ind)) setIndent(ind);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(formatXml(input, parseInt(indent, 10)));
    } catch (e: any) {
      setOutput('Error: ' + e.message);
    }
  }, [input, indent]);

  const extraElements = (
    <select
      value={indent}
      onChange={(e) => setIndent(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="2">2 spaces</option>
      <option value="4">4 spaces</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="XML Formatter"
      description="Pretty-print XML with configurable indentation. Paste compact or malformed-whitespace XML and get a clean, indented result. For example, [1 &lt;root&gt;&lt;item&gt;1&lt;/item&gt;&lt;/root&gt; 2] becomes a readable tree."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input XML"
      toTitle="Formatted XML"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── SQL Formatter ────────────────────────────────────────────────────────────

export function SqlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState('sql');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const dl = params.get('dialect');
    if (dl && ['sql', 'mysql', 'postgresql', 'bigquery'].includes(dl)) setDialect(dl);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    (async () => {
      try {
        const { format } = await import('sql-formatter');
        setOutput(format(input, { language: dialect as any }));
      } catch (e: any) {
        setOutput('Error: ' + e.message);
      }
    })();
  }, [input, dialect]);

  const extraElements = (
    <select
      value={dialect}
      onChange={(e) => setDialect(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="sql">Standard SQL</option>
      <option value="mysql">MySQL</option>
      <option value="postgresql">PostgreSQL</option>
      <option value="bigquery">BigQuery</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="SQL Formatter"
      description="Format SQL queries with dialect-aware pretty-printing. Choose your SQL dialect and paste a query to get a clean, readable result. For example, [1 SELECT id,name FROM users WHERE active=1 2] becomes a multi-line formatted query."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input SQL"
      toTitle="Formatted SQL"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── HTML Formatter / Minifier ───────────────────────────────────────────────

export function HtmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('format');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m && ['format', 'minify'].includes(m)) setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'minify') {
      setOutput(minifyHtml(input));
      return;
    }
    (async () => {
      try {
        const prettier = await import('prettier/standalone');
        const htmlPlugin = await import('prettier/plugins/html');
        const result = await prettier.format(input, {
          parser: 'html',
          plugins: [htmlPlugin],
          printWidth: 80,
        });
        setOutput(result);
      } catch (e: any) {
        setOutput('Error: ' + e.message);
      }
    })();
  }, [input, mode]);

  const extraElements = (
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="format">Format (pretty-print)</option>
      <option value="minify">Minify</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="HTML Formatter & Minifier"
      description="Format or minify HTML. Format mode uses Prettier for clean, indented output. Minify mode collapses whitespace between tags. For example, [1 &lt;div&gt;  &lt;p&gt;hello&lt;/p&gt;  &lt;/div&gt; 2] can be formatted or minified instantly."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input HTML"
      toTitle="Output HTML"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── CSS Formatter / Minifier ────────────────────────────────────────────────

export function CssFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('format');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m && ['format', 'minify'].includes(m)) setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'minify') {
      setOutput(minifyCss(input));
      return;
    }
    (async () => {
      try {
        const prettier = await import('prettier/standalone');
        const postcssPlugin = await import('prettier/plugins/postcss');
        const result = await prettier.format(input, {
          parser: 'css',
          plugins: [postcssPlugin],
          printWidth: 80,
        });
        setOutput(result);
      } catch (e: any) {
        setOutput('Error: ' + e.message);
      }
    })();
  }, [input, mode]);

  const extraElements = (
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="format">Format (pretty-print)</option>
      <option value="minify">Minify</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="CSS Formatter & Minifier"
      description="Format or minify CSS online. Format mode uses Prettier for clean output with each rule on its own line. Minify mode removes comments and collapses whitespace. For example, [1 body { margin : 0 ; padding : 0 ; } 2] can be formatted or minified."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input CSS"
      toTitle="Output CSS"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── JS Formatter / Minifier ─────────────────────────────────────────────────

export function JsFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('format');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m && ['format', 'minify'].includes(m)) setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'minify') {
      setOutput(minifyJs(input));
      return;
    }
    (async () => {
      try {
        const prettier = await import('prettier/standalone');
        const babelPlugin = await import('prettier/plugins/babel');
        const estreePlugin = await import('prettier/plugins/estree');
        const result = await prettier.format(input, {
          parser: 'babel',
          plugins: [babelPlugin, estreePlugin],
          printWidth: 80,
        });
        setOutput(result);
      } catch (e: any) {
        setOutput('Error: ' + e.message);
      }
    })();
  }, [input, mode]);

  const extraElements = (
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
    >
      <option value="format">Format (pretty-print)</option>
      <option value="minify">Minify</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="JavaScript Formatter & Minifier"
      description="Format or minify JavaScript online. Format mode uses Prettier for clean, opinionated output. Minify mode strips comments and collapses whitespace. For example, [1 function add(a,b){return a+b} 2] becomes formatted or minified JS."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input JavaScript"
      toTitle="Output JavaScript"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}

// ─── YAML Validator ──────────────────────────────────────────────────────────

export function YamlValidator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const result = validateYaml(input);
    if (result.valid) {
      setOutput(result.canonical ?? '');
    } else {
      setOutput(`Error: ${result.error ?? 'Invalid YAML'}`);
    }
  }, [input]);

  return (
    <AdvancedConverter
      title="YAML Validator"
      description="Validate YAML and view its canonical form. Paste any YAML — if it is valid the output shows the normalised, re-dumped YAML. If it is invalid the exact error is shown. For example, [1 name: Alice\nage: 30 2] is valid and returns canonical output."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input YAML"
      toTitle="Canonical YAML / Validation Result"
      backColor="lime"
      extraElements={<></>}
    />
  );
}

