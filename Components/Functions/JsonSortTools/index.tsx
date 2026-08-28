'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { sortJson } from './logic';

export const JsonSorter = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      if (from) setFromValue(from);
    }
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      const result = sortJson(fromValue);
      toValue = `// Keys: ${result.keyCount} total, Depth: ${result.depth}\n` + result.sorted;
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid JSON';
    }
  }

  return (
    <BasicConverter
      title="JSON Key Sorter"
      description="Sort all keys in a [1 JSON object 2] alphabetically, recursively through nested objects and arrays. Useful for [1 normalizing JSON 2] structure and reducing diff noise."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Input"
      toTitle="Sorted JSON"
      backColor="cyan"
    />
  );
};
