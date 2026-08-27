'use client';

import React from 'react';

type PipelineInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function PipelineInput({ value, onChange }: PipelineInputProps) {
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
