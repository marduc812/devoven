'use client';

import { useState, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { toKebabCase, toSnakeCase, toCamelCase, toPascalCase, toConstantCase } from './logic';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function SlugRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 first:border-t-0">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 w-32 flex-shrink-0">{label}</span>
      <code className="flex-1 text-sm font-mono text-gray-900 break-all">{value || <span className="text-gray-400">—</span>}</code>
      {value && (
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-gray-900 flex-shrink-0 transition-colors duration-100"
        >
          {copied ? 'copied!' : 'copy'}
        </button>
      )}
    </div>
  );
}

export const SlugGenerator = () => {
  const [input, setInput] = useState('');

  const variants = useMemo(() => {
    if (!input.trim()) return null;
    return {
      kebab: toKebabCase(input),
      snake: toSnakeCase(input),
      camel: toCamelCase(input),
      pascal: toPascalCase(input),
      constant: toConstantCase(input),
    };
  }, [input]);

  return (
    <Panel
      title="Slug Generator"
      description="Generate slugs in multiple formats from any text. Paste text to get [1 kebab-case 2], [1 snake_case 2], [1 camelCase 2], [1 PascalCase 2], and [1 CONSTANT_CASE 2] variants instantly. Click any row to copy."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Input Text</label>
            <input
              type="text"
              className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full"
              placeholder="e.g. Hello World! This is a Test"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {variants && (
            <div className="border border-gray-200 overflow-hidden">
              <SlugRow label="kebab-case" value={variants.kebab} />
              <SlugRow label="snake_case" value={variants.snake} />
              <SlugRow label="camelCase" value={variants.camel} />
              <SlugRow label="PascalCase" value={variants.pascal} />
              <SlugRow label="CONSTANT_CASE" value={variants.constant} />
            </div>
          )}

          {!input.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter text above to generate slug variants</p>
          )}
        </div>
      }
    />
  );
};
