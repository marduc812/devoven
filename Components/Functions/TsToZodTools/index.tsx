'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertTsToZod } from './logic';

export const TsToZod = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = convertTsToZod(fromValue);
    } catch (e) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="TypeScript to Zod Schema"
      description="Convert [1 TypeScript 2] interfaces and type definitions to [1 Zod 2] schemas. Supports string, number, boolean, null, optional fields (?), unions (|), arrays, and nested objects."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="TypeScript Interface / Type"
      toTitle="Zod Schema"
      backColor="cyan"
    />
  );
};
