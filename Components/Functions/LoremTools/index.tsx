'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateLorem, STYLE_LABELS } from './logic';
import type { LoremStyle, LoremUnit } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const STYLES: LoremStyle[] = ['lorem', 'cicero', 'english', 'hipster', 'corporate'];
const UNITS: LoremUnit[] = ['words', 'sentences', 'paragraphs'];

export function LoremGenerator() {
  const [style, setStyle] = useState<LoremStyle>('lorem');
  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [count, setCount] = useState(3);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setCount(Math.max(1, parseInt(from, 10) || 3));
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: count })

  const output = useMemo(() => {
    try {
      return generateLorem({ style, unit, count: Math.max(1, count) });
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }, [style, unit, count]);

  const selectClass =
    'bg-white text-gray-900 px-3 py-1.5 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';
  const inputClass =
    'bg-white text-gray-900 px-3 py-1.5 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm w-20';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

  return (
    <Panel
      title="Lorem Ipsum Generator"
      description="Generate placeholder text in multiple styles: [1 Lorem Ipsum 2], [1 Cicero Latin 2], [1 Random English 2], [1 Hipster 2], and [1 Corporate Buzzwords 2]. Choose words, sentences, or paragraphs."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className={`${labelClass} block mb-1`}>Style</label>
              <select className={selectClass} value={style} onChange={e => setStyle(e.target.value as LoremStyle)}>
                {STYLES.map(s => (
                  <option key={s} value={s}>{STYLE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Unit</label>
              <select className={selectClass} value={unit} onChange={e => setUnit(e.target.value as LoremUnit)}>
                {UNITS.map(u => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Count</label>
              <input
                type="number"
                min={1}
                max={100}
                className={inputClass}
                value={count}
                onChange={e => setCount(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          {/* Output */}
          <div>
            <p className={`${labelClass} mb-1`}>Generated Text</p>
            <textarea
              readOnly
              className="bg-white text-gray-900 p-3 w-full border border-gray-200 font-mono text-sm resize-y min-h-[200px] focus:outline-none"
              value={output}
            />
          </div>
        </div>
      }
    />
  );
}
