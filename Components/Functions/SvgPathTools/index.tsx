'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseSvgPath, formatPathOutput } from './logic';

const EXAMPLE_PATHS = [
  { name: 'Simple rect', d: 'M 10 10 H 90 V 90 H 10 Z' },
  { name: 'Triangle', d: 'M 50 10 L 90 90 L 10 90 Z' },
  { name: 'Arc', d: 'M 10 80 C 40 10, 65 10, 95 80' },
  { name: 'Heart', d: 'M 75 40 C 75 37, 70 25, 50 25 C 20 25, 20 62.5, 20 62.5 C 20 80, 40 92, 50 100 C 60 92, 80 80, 80 62.5 C 80 62.5, 80 25, 50 25' },
];

export function SvgPathAnalyzer() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      const result = parseSvgPath(fromValue);
      setToValue(formatPathOutput(result));
    } catch (e) {
      setToValue(e instanceof Error ? 'Error: ' + e.message : 'Error parsing path');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="SVG Path Analyzer"
      description={'Parse and explain an SVG path [1 d 2] attribute. Each command ([1 M, L, H, V, C, S, Q, T, A, Z 2]) is explained with its parameters and human-readable description.'}
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="SVG Path (d attribute)"
      toTitle="Analysis"
      backColor="cyan"
    />
  );
}
