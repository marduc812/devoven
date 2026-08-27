'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processGradientInput, parseGradientConfig, generateGradient, GRADIENT_EXAMPLES, GRADIENT_TEMPLATE } from './logic';

export const CssGradientGenerator = () => {
  const [fromValue, setFromValue] = useState(GRADIENT_TEMPLATE);
  const [toValue, setToValue] = useState('');
  const [previewStyle, setPreviewStyle] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || '';
      if (from) setFromValue(from);
    }
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); setPreviewStyle(''); return; }
    try {
      const output = processGradientInput(fromValue);
      setToValue(output);
      // Build preview style
      try {
        const config = parseGradientConfig(fromValue);
        const grad = generateGradient(config);
        setPreviewStyle(grad.standard);
      } catch {
        setPreviewStyle('');
      }
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Invalid input');
      setPreviewStyle('');
    }
  }, [fromValue]);

  const extraElements = (
    <div className="flex flex-col gap-3">
      {previewStyle && (
        <div>
          <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">Preview</p>
          <div
            className="w-full h-20 border border-gray-200"
            style={{ background: previewStyle }}
          />
        </div>
      )}
      <div>
        <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">Quick Examples</p>
        <div className="flex flex-wrap gap-2">
          {GRADIENT_EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => setFromValue(ex.config)}
              className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors duration-200 cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="CSS Gradient Generator"
      description="Generate CSS gradient code from a simple config. Supports [1 linear 2], [1 radial 2], and [1 conic 2] gradients with vendor-prefixed output."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Gradient Config"
      toTitle="CSS Output"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};
