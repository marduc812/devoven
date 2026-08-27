'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OPERATIONS } from '@/lib/blocks/registry';
import { CATEGORY_ORDER, categoryAccent, categoryLabel } from './categoryMeta';
import { IoCloseOutline, IoSearchOutline } from 'react-icons/io5';

type AddBlockModalProps = {
  insertAtIndex: number;
  onAdd: (operationId: string, atIndex: number) => void;
  onClose: () => void;
};

function AddBlockModalContent({ insertAtIndex, onAdd, onClose }: AddBlockModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = OPERATIONS.filter((op) =>
    op.name.toLowerCase().includes(query.toLowerCase()) ||
    op.category.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    ops: filtered.filter((op) => op.category === cat),
  })).filter((g) => g.ops.length > 0);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-900 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-black text-lg text-gray-900 tracking-tight">Add Block</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 border border-gray-300 focus-within:border-gray-900 px-3 py-2 transition-colors">
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
          <p className="text-xs text-gray-400 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-300 text-gray-500">End</span>
            {' '}marks a terminal block — it produces a final result, so nothing runs after it.
          </p>
        </div>

        {/* Operations list */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
          {grouped.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No operations found</p>
          )}

          {grouped.map(({ category, ops }) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 ${categoryAccent[category] ?? 'bg-gray-400'}`} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {categoryLabel[category]}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {ops.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => { onAdd(op.id, insertAtIndex); onClose(); }}
                    title={
                      op.terminal
                        ? 'Terminal: produces a final result — nothing can run after it'
                        : op.chainable ? undefined : 'Warning: output may not chain well'
                    }
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 text-gray-700 font-medium hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                  >
                    {!op.chainable && !op.terminal && <span title="Non-chainable output">⚠</span>}
                    {op.name}
                    {op.terminal && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-400 text-gray-500">
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
