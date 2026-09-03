'use client';

import React from 'react';
import { InputField } from '@/lib/blocks/types';

type PipelineInputProps = {
  value: string;
  onChange: (value: string) => void;
  /**
   * When the first block takes several named values, the pipeline input is
   * those fields rather than one textarea: the shape of what the user types
   * follows the block that reads it.
   */
  fields?: InputField[];
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
};

export default function PipelineInput({ value, onChange, fields, fieldValues, onFieldChange }: PipelineInputProps) {
  if (fields && fields.length > 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Input</span>
          <span className="text-xs text-gray-400 font-mono">{fields.length} fields</span>
        </div>
        <div className="grid gap-3 p-3 border border-gray-300 bg-white" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${fields.length > 3 ? 120 : 160}px, 1fr))` }}>
          {fields.map((field) => (
            <label key={field.id} className="flex flex-col gap-1">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{field.label}</span>
              <input
                type="text"
                className="w-full px-2 py-1.5 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm bg-white text-gray-900 placeholder:text-gray-400 transition-colors duration-150"
                value={fieldValues?.[field.id] ?? ''}
                placeholder={field.placeholder ?? field.label}
                spellCheck={false}
                onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }

  const lines = value ? value.split('\n').length : 0;
  const words = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = value.length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Input</span>
        <span className="text-xs text-gray-400 font-mono">
          {chars} chars · {words} words · {lines} lines
        </span>
      </div>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm resize-y bg-white text-gray-900 placeholder:text-gray-400 transition-colors duration-150"
        placeholder="Enter your input here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
