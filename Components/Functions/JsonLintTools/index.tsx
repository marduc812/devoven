'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { lintJson, formatLintResult } from './logic';

export const JsonLint = ({ article }: { article?: React.ReactNode } = {}) => {
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
      article={article}
      backColor="lime"
      title="JSON lint and syntax checker"
      description={"Check JSON syntax and read the parser error when input is invalid. The report includes line and column information when the browser error exposes a position."}
      fromTitle="JSON Input"
      toTitle="Validation Result"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
