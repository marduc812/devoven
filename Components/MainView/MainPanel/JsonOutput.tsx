import React, { useMemo } from 'react';

const tokenColors = {
  key: 'text-sky-700',
  string: 'text-emerald-700',
  number: 'text-amber-700',
  boolean: 'text-violet-700',
  null: 'text-rose-700',
};

export default function JsonOutput({ value, label }: { value: string; label: string }) {
  const content = useMemo(() => {
    // Keep validation errors as plain text. Never parse and reserialize the
    // output, since that could change number precision or property order.
    try {
      JSON.parse(value);
    } catch {
      return value;
    }

    const tokens = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g;
    const parts: React.ReactNode[] = [];
    let end = 0;
    for (const match of value.matchAll(tokens)) {
      const start = match.index!;
      const text = match[0];
      if (start > end) parts.push(value.slice(end, start));
      const type = text.startsWith('"')
        ? /^\s*:/.test(value.slice(start + text.length)) ? 'key' : 'string'
        : text === 'true' || text === 'false' ? 'boolean'
        : text === 'null' ? 'null' : 'number';
      parts.push(<span key={start} className={tokenColors[type]}>{text}</span>);
      end = start + text.length;
    }
    if (end < value.length) parts.push(value.slice(end));
    return parts;
  }, [value]);

  return (
    <pre
      role="textbox"
      aria-label={label}
      aria-readonly="true"
      aria-multiline="true"
      tabIndex={0}
      className="bg-gray-50 text-gray-900 p-3 w-full h-[126px] min-h-[126px] border border-gray-300 resize-y overflow-auto whitespace-pre-wrap break-words font-mono text-sm focus:outline-none focus:border-gray-900"
    ><code>{content}</code></pre>
  );
}
