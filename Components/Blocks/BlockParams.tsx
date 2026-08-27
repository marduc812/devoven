'use client';

import React from 'react';
import { ParamDefinition } from '@/lib/blocks/types';

type BlockParamsProps = {
  params: ParamDefinition[];
  values: Record<string, string>;
  onChange: (paramId: string, value: string) => void;
};

export default function BlockParams({ params, values, onChange }: BlockParamsProps) {
  if (params.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2">
      {params.map((param) => (
        <label key={param.id} className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{param.label}:</span>
          {param.kind === 'select' ? (
            <select
              className="border border-gray-300 bg-white text-gray-900 text-xs px-2 py-0.5 focus:border-gray-900 focus:outline-none"
              value={values[param.id] ?? param.default}
              onChange={(e) => onChange(param.id, e.target.value)}
            >
              {param.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="border border-gray-300 bg-white text-gray-900 text-xs px-2 py-0.5 min-w-[80px] focus:border-gray-900 focus:outline-none"
              value={values[param.id] ?? param.default}
              placeholder={param.label}
              onChange={(e) => onChange(param.id, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
