'use client';

import React from 'react';
import { IoLinkOutline, IoUnlinkOutline } from 'react-icons/io5';
import { InputField } from '@/lib/blocks/types';

type BlockInputsProps = {
  fields: InputField[];
  values: Record<string, string>;
  /** The field fed by the previous block, or null when every field is typed in. */
  linked: string | null;
  /** What the previous block produced (or the pipeline input for the first block). */
  upstream: string;
  onChange: (fieldId: string, value: string) => void;
  onLinkChange: (fieldId: string | null) => void;
};

/**
 * One box per named input of a multi-input operation. The linked field shows
 * the upstream value read-only; every other field is typed on the block. The
 * first block never renders this: its fields are the pipeline input pane.
 */
export default function BlockInputs({ fields, values, linked, upstream, onChange, onLinkChange }: BlockInputsProps) {
  const source = 'previous block';

  return (
    <div className="flex flex-wrap items-end gap-3 px-3 py-2">
      {fields.map((field) => {
        const isLinked = field.id === linked;
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{field.label}</span>
            <div className={`flex items-stretch border ${isLinked ? 'border-dashed border-gray-400 bg-gray-100' : 'border-gray-300 bg-white'}`}>
              {isLinked ? (
                <input
                  type="text"
                  readOnly
                  className="w-24 px-2 py-0.5 text-xs font-mono bg-transparent text-gray-600 outline-none truncate"
                  value={upstream}
                  placeholder={`← ${source}`}
                  title={upstream ? `From the ${source}: ${upstream}` : `Fed by the ${source}`}
                />
              ) : (
                <input
                  type="text"
                  className="w-24 px-2 py-0.5 text-xs font-mono bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                  value={values[field.id] ?? ''}
                  placeholder={field.placeholder ?? field.label}
                  spellCheck={false}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (isLinked) {
                    // Keep what the user was looking at when they cut the link.
                    onChange(field.id, upstream);
                    onLinkChange(null);
                  } else {
                    onLinkChange(field.id);
                  }
                }}
                title={isLinked ? `Fed by the ${source} — click to type a value instead` : `Feed this field from the ${source}`}
                className={`flex items-center px-1.5 border-l transition-colors ${
                  isLinked
                    ? 'border-gray-400 text-gray-900 hover:text-red-600'
                    : 'border-gray-200 text-gray-400 hover:text-gray-900'
                }`}
              >
                {isLinked ? <IoLinkOutline className="text-sm" /> : <IoUnlinkOutline className="text-sm" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
