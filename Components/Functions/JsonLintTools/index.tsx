'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { lintJson, formatLintResult } from './logic';

export const JsonLint = () => {
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
    const result = lintJson(fromValue);
    return formatLintResult(result);
  }, [fromValue]);

  return (
    <BasicConverter
      backColor="lime"
      title="JSON Lint"
      description="Validate [1JSON2] and get friendly error messages with line and column information. Paste your JSON to check if it's valid."
      fromTitle="JSON Input"
      toTitle="Validation Result"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
