'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { OPERATIONS } from '@/lib/blocks/registry';
import { OperationCategory } from '@/lib/blocks/types';
import { CATEGORY_ORDER, categoryAccent, categoryLabel } from './categoryMeta';
import { IoCloseOutline, IoSearchOutline } from 'react-icons/io5';

type AddBlockModalProps = {
  insertAtIndex: number;
  onAdd: (operationId: string, atIndex: number) => void;
  onClose: () => void;
};

type Filter = OperationCategory | 'all';

function AddBlockModalContent({ insertAtIndex, onAdd, onClose }: AddBlockModalProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OPERATIONS;
    return OPERATIONS.filter((op) =>
      op.name.toLowerCase().includes(q) ||
      categoryLabel[op.category].toLowerCase().includes(q)
    );
  }, [query]);

  const counts = useMemo(() => {
    const map = {} as Record<OperationCategory, number>;
    for (const cat of CATEGORY_ORDER) map[cat] = 0;
    for (const op of matches) map[op.category] += 1;
    return map;
  }, [matches]);

  // A search that empties the chosen category falls back to every match,
  // so typing never leaves the picker looking broken.
  const effectiveFilter: Filter = filter !== 'all' && counts[filter] === 0 ? 'all' : filter;

  const grouped = CATEGORY_ORDER
    .filter((cat) => effectiveFilter === 'all' || cat === effectiveFilter)
    .map((cat) => ({ category: cat, ops: matches.filter((op) => op.category === cat) }))
    .filter((g) => g.ops.length > 0);

  const add = (operationId: string) => { onAdd(operationId, insertAtIndex); onClose(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && query.trim() && grouped.length > 0) add(grouped[0].ops[0].id);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-900 shadow-2xl w-[min(1120px,95vw)] h-[min(760px,88vh)] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header + search on one row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200">
          <h2 className="font-black text-lg text-gray-900 tracking-tight flex-shrink-0">Add Block</h2>
          <div className="flex items-center gap-2 border border-gray-300 focus-within:border-gray-900 px-3 py-2 transition-colors flex-1 max-w-md">
            <IoSearchOutline className="text-gray-400 text-lg flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search operations..."
              className="flex-1 outline-none text-sm bg-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <span className="ml-auto text-xs text-gray-400 hidden sm:block">
            {matches.length} operation{matches.length === 1 ? '' : 's'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0">
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row min-h-0">
          {/* Categories: a sidebar on desktop, a scrolling chip row on phones */}
          <nav className="flex sm:flex-col gap-1 sm:gap-0.5 overflow-x-auto sm:overflow-y-auto sm:w-48 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 p-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 text-left text-sm px-2 py-1.5 whitespace-nowrap transition-colors ${
                effectiveFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="font-medium">All</span>
              <span className={`ml-auto text-xs ${effectiveFilter === 'all' ? 'text-gray-300' : 'text-gray-400'}`}>
                {matches.length}
              </span>
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const active = effectiveFilter === cat;
              const empty = counts[cat] === 0;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  disabled={empty}
                  className={`flex items-center gap-2 text-left text-sm px-2 py-1.5 whitespace-nowrap transition-colors ${
                    active ? 'bg-gray-900 text-white' : empty ? 'text-gray-300 cursor-default' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-2 h-2 flex-shrink-0 ${empty ? 'bg-gray-200' : categoryAccent[cat] ?? 'bg-gray-400'}`} />
                  <span className="font-medium">{categoryLabel[cat]}</span>
                  <span className={`ml-auto text-xs ${active ? 'text-gray-300' : 'text-gray-400'}`}>{counts[cat]}</span>
                </button>
              );
            })}
          </nav>

          {/* Operations */}
          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
            {grouped.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No operations found</p>
            )}

            {grouped.map(({ category, ops }) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 ${categoryAccent[category] ?? 'bg-gray-400'}`} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {categoryLabel[category]}
                  </h3>
                  <span className="text-xs text-gray-300">{ops.length}</span>
                </div>
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {ops.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => add(op.id)}
                      title={op.terminal ? `${op.name} — terminal: produces a final result, nothing can run after it` : op.name}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-300 text-gray-700 font-medium text-left hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <span className="flex-1 min-w-0 truncate">{op.name}</span>
                      {op.inputs && op.inputs.length > 0 && (
                        <span
                          className="flex-none max-w-[40%] truncate text-[10px] font-mono px-1 py-px bg-gray-100 text-gray-500"
                          title={`Takes ${op.inputs.length} inputs: ${op.inputs.map((f) => f.label).join(', ')}`}
                        >
                          {op.inputs.map((f) => f.label).join('·')}
                        </span>
                      )}
                      {op.terminal && (
                        <span className="flex-none text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-400 text-gray-500">
                          End
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend: one line until asked for, so the grid keeps the height */}
        <details className="border-t border-gray-200 px-4 py-2.5 group">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors marker:text-gray-300">
            What the <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-300 text-gray-500">End</span>{' '}
            and field tags mean
          </summary>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-300 text-gray-500">End</span>
            {' '}marks a terminal block — it produces a final result, so nothing runs after it.
            A block tagged with field names, like{' '}
            <span className="text-[10px] font-mono px-1 py-px bg-gray-100 text-gray-500">R·G·B</span>, takes several
            values: the previous output feeds one field, you type the rest. Flow blocks change how the rest runs:
            Each Line runs every later block once per line, and Remember stores a value you can write as{' '}
            <span className="text-[10px] font-mono px-1 py-px bg-gray-100 text-gray-500">{'{name}'}</span> in any later field.
          </p>
        </details>
      </div>
    </>
  );
}

export default function AddBlockModal(props: AddBlockModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const portalEl = document.getElementById('overlays');
  if (portalEl) return createPortal(<AddBlockModalContent {...props} />, portalEl);
  return <AddBlockModalContent {...props} />;
}
