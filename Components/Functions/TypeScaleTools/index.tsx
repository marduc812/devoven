'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatScale } from './logic';

export function TypeScaleGenerator() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(formatScale(fromValue));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Error');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Type Scale Generator"
      description="Generate a typographic scale. Enter [1 base size and ratio 2] (e.g. [1 16 1.333 2] or [1 16 perfect fourth 2]). Choose from presets: Minor Second (1.067), Major Second (1.125), Minor Third (1.2), Major Third (1.25), Perfect Fourth (1.333), Golden Ratio (1.618). Output includes px, rem, em, and CSS custom properties."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Base size + ratio (e.g. 16 1.333 or 16 golden ratio)"
      toTitle="Typography Scale"
      backColor="cyan"
    />
  );
}
