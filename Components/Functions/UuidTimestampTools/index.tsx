'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { extractUuidTimestamp, formatUuidTimestamp } from './logic';

export const UuidTimestamp = () => {
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
      const info = extractUuidTimestamp(fromValue);
      return formatUuidTimestamp(info);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Invalid UUID';
    }
  }, [fromValue]);

  return (
    <BasicConverter
      backColor="cyan"
      title="UUID to Timestamp"
      description="Extract the embedded timestamp from [1UUID v12] and [1UUID v72] identifiers. Shows creation time in ISO 8601, UTC, and Unix formats."
      fromTitle="UUID Input"
      toTitle="Timestamp Info"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
