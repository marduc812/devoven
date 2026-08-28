'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateJsonSchema } from './logic';

export const JsonSchemaGenerator = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = generateJsonSchema(fromValue);
    } catch (e) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="JSON Schema Generator"
      description="Paste a [1 JSON example 2] to automatically infer a JSON Schema (Draft 7). Detects types, required fields, nested objects, arrays, and string formats like [1 date-time 2], [1 email 2], and [1 uri 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Example"
      toTitle="JSON Schema (Draft 7)"
      backColor="cyan"
    />
  );
};
