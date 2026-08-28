'use client';

import { useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  DEFAULT_OPTIONS,
  generateFullConfig,
  PrettierOptions,
  TrailingComma,
  PrintWidth,
  TabWidth,
  EndOfLine,
} from './logic';

export function PrettierConfigGenerator() {
  const [opts, setOpts] = useState<PrettierOptions>({ ...DEFAULT_OPTIONS });
  const [showFull, setShowFull] = useState(false);

  const fromValue = [
    `printWidth=${opts.printWidth}`,
    `tabWidth=${opts.tabWidth}`,
    `useTabs=${opts.useTabs}`,
    `semi=${opts.semi}`,
    `singleQuote=${opts.singleQuote}`,
    `trailingComma=${opts.trailingComma}`,
    `bracketSpacing=${opts.bracketSpacing}`,
    `arrowParens=${opts.arrowParens}`,
    `endOfLine=${opts.endOfLine}`,
    `jsxSingleQuote=${opts.jsxSingleQuote}`,
    `bracketSameLine=${opts.bracketSameLine}`,
  ].join('\n');

  const toValue = generateFullConfig(opts);

  const set = <K extends keyof PrettierOptions>(key: K, val: PrettierOptions[K]) =>
    setOpts((prev) => ({ ...prev, [key]: val }));

  const row = 'flex items-center justify-between py-1.5 border-b border-gray-200';
  const label = 'text-xs text-gray-400 flex-1';
  const selectCls = 'bg-gray-100 text-gray-900 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-400';
  const toggleCls = (active: boolean) =>
    `px-2.5 py-1 rounded text-xs border transition-all ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white/5 text-gray-400 border-gray-200 hover:bg-gray-100'
    }`;

  return (
    <AdvancedConverter
      title="Prettier Config Generator"
      description="Generate a [1 .prettierrc 2] JSON configuration by selecting your formatting preferences. Each option shows its default value and effect on your code."
      fromTitle="Options summary"
      toTitle=".prettierrc"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={() => {}}
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-1 w-full">
          <div className={row}>
            <span className={label}>Print Width</span>
            <select className={selectCls} value={opts.printWidth} onChange={(e) => set('printWidth', Number(e.target.value) as PrintWidth)}>
              {([80, 100, 120, 140] as PrintWidth[]).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className={row}>
            <span className={label}>Tab Width</span>
            <select className={selectCls} value={opts.tabWidth} onChange={(e) => set('tabWidth', Number(e.target.value) as TabWidth)}>
              {([2, 4] as TabWidth[]).map((v) => <option key={v} value={v}>{v} spaces</option>)}
            </select>
          </div>
          <div className={row}>
            <span className={label}>Use Tabs</span>
            <div className="flex gap-1">
              <button className={toggleCls(!opts.useTabs)} onClick={() => set('useTabs', false)}>Spaces</button>
              <button className={toggleCls(opts.useTabs)} onClick={() => set('useTabs', true)}>Tabs</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>Semicolons</span>
            <div className="flex gap-1">
              <button className={toggleCls(opts.semi)} onClick={() => set('semi', true)}>Yes</button>
              <button className={toggleCls(!opts.semi)} onClick={() => set('semi', false)}>No</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>Quote Style</span>
            <div className="flex gap-1">
              <button className={toggleCls(!opts.singleQuote)} onClick={() => set('singleQuote', false)}>Double</button>
              <button className={toggleCls(opts.singleQuote)} onClick={() => set('singleQuote', true)}>Single</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>JSX Quotes</span>
            <div className="flex gap-1">
              <button className={toggleCls(!opts.jsxSingleQuote)} onClick={() => set('jsxSingleQuote', false)}>Double</button>
              <button className={toggleCls(opts.jsxSingleQuote)} onClick={() => set('jsxSingleQuote', true)}>Single</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>Trailing Commas</span>
            <select className={selectCls} value={opts.trailingComma} onChange={(e) => set('trailingComma', e.target.value as TrailingComma)}>
              <option value="none">none</option>
              <option value="es5">es5</option>
              <option value="all">all</option>
            </select>
          </div>
          <div className={row}>
            <span className={label}>Bracket Spacing</span>
            <div className="flex gap-1">
              <button className={toggleCls(opts.bracketSpacing)} onClick={() => set('bracketSpacing', true)}>Yes</button>
              <button className={toggleCls(!opts.bracketSpacing)} onClick={() => set('bracketSpacing', false)}>No</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>Bracket Same Line (JSX)</span>
            <div className="flex gap-1">
              <button className={toggleCls(!opts.bracketSameLine)} onClick={() => set('bracketSameLine', false)}>No</button>
              <button className={toggleCls(opts.bracketSameLine)} onClick={() => set('bracketSameLine', true)}>Yes</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>Arrow Parens</span>
            <div className="flex gap-1">
              <button className={toggleCls(opts.arrowParens === 'always')} onClick={() => set('arrowParens', 'always')}>Always</button>
              <button className={toggleCls(opts.arrowParens === 'avoid')} onClick={() => set('arrowParens', 'avoid')}>Avoid</button>
            </div>
          </div>
          <div className={row}>
            <span className={label}>End of Line</span>
            <select className={selectCls} value={opts.endOfLine} onChange={(e) => set('endOfLine', e.target.value as EndOfLine)}>
              <option value="lf">lf (Unix)</option>
              <option value="crlf">crlf (Windows)</option>
              <option value="auto">auto</option>
            </select>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-xs text-gray-400 underline"
            >
              {showFull ? 'Show diff-only config' : 'Show full config'}
            </button>
          </div>
        </div>
      }
    />
  );
}
