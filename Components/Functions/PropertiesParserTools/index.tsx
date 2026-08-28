'use client';

import React, { useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { propertiesToJson, jsonToProperties } from './logic';

export const PropertiesParser = () => {
  const [fromValue, setFromValue] = useState('');
  const [mode, setMode] = useState<'toJson' | 'toProps'>('toJson');

  const toValue = React.useMemo(() => {
    if (!fromValue.trim()) return '';
    try {
      return mode === 'toJson' ? propertiesToJson(fromValue) : jsonToProperties(fromValue);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Invalid input';
    }
  }, [fromValue, mode]);

  const modeSelector = (
    <select
      value={mode}
      onChange={e => setMode(e.target.value as 'toJson' | 'toProps')}
      className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer"
    >
      <option value="toJson">.properties → JSON</option>
      <option value="toProps">JSON → .properties</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="Properties File Parser"
      description="Parse Java [1.properties2] files to JSON or convert JSON back to properties format. Supports [1comments2], [1continuation lines2], and escape sequences."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={mode === 'toJson' ? '.properties Input' : 'JSON Input'}
      toTitle={mode === 'toJson' ? 'JSON Output' : '.properties Output'}
      backColor="cyan"
      extraElements={modeSelector}
    />
  );
};
