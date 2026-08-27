'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { stripTypes } from './logic';

export const TsToJs = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(decodeURIComponent(from));
  }, []);

  const toValue = React.useMemo(() => {
    if (!fromValue.trim()) return '';
    try {
      return stripTypes(fromValue);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Invalid input';
    }
  }, [fromValue]);

  return (
    <BasicConverter
      backColor="cyan"
      title="TypeScript to JavaScript Stripper"
      description="Strip TypeScript type annotations from TypeScript code, leaving valid JavaScript. Handles [1interfaces2], [1type aliases2], [1access modifiers2], and common type annotations. Note: simplified approach — complex union types may not be fully stripped."
      fromTitle="TypeScript Input"
      toTitle="JavaScript Output"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
