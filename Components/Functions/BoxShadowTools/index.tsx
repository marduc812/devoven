'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatBoxShadowOutput, getBoxShadowPresets } from './logic';

export function BoxShadowGenerator() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const presets = getBoxShadowPresets();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    setToValue(formatBoxShadowOutput(fromValue));
  }, [fromValue]);

  const description =
    'Generate CSS [1 box-shadow 2] values from key=value pairs. Format: [1 x=4, y=4, blur=10, spread=0, color=rgba(0,0,0,0.3) 2]. Separate multiple shadows with semicolons. Or click a preset below.\n\n' +
    'Presets:\n' +
    presets.map(function(p) { return p.name + ': ' + p.css; }).join('\n');

  return (
    <BasicConverter
      title="Box Shadow Generator"
      description={'Generate CSS [1 box-shadow 2] from [1 key=value 2] pairs. Format: x=4, y=4, blur=10, spread=0, color=rgba(0,0,0,0.3). Separate multiple shadows with semicolons [1 ; 2].'}
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Shadow Config (key=value)"
      toTitle="CSS Output"
      backColor="cyan"
    />
  );
}

