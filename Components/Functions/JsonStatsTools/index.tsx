'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { analyzeJson, formatJsonStats } from './logic';

export const JsonStats = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      const stats = analyzeJson(fromValue);
      toValue = formatJsonStats(stats);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid JSON';
    }
  }

  return (
    <BasicConverter
      title="JSON Statistics"
      description="Analyze a [1 JSON 2] structure and get statistics: depth, key count, value type distribution, and more."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Input"
      toTitle="Statistics"
      backColor="cyan"
    />
  );
};
