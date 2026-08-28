'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { propertiesToJson, jsonToProperties, detectPropertiesOrJson } from './logic';

export function PropertiesJsonConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'auto' | 'props-to-json' | 'json-to-props'>('auto');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const effectiveDirection =
        direction === 'auto'
          ? (detectPropertiesOrJson(input) === 'json' ? 'json-to-props' : 'props-to-json')
          : direction;
      if (effectiveDirection === 'props-to-json') {
        setOutput(propertiesToJson(input));
      } else {
        setOutput(jsonToProperties(input));
      }
    } catch (e: unknown) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error: invalid input');
    }
  }, [input, direction]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Direction:</span>
      <select
        className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={direction}
        onChange={e => setDirection(e.target.value as 'auto' | 'props-to-json' | 'json-to-props')}
      >
        <option value="auto">Auto-detect</option>
        <option value="props-to-json">.properties → JSON</option>
        <option value="json-to-props">JSON → .properties</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Properties File to JSON"
      description="Convert Java [1.properties2] files to JSON and back. Supports [1# and ! comments2], [1multiline values2] with backslash continuation, and [1\\uXXXX unicode escapes2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (.properties or JSON)"
      toTitle="Output"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}
