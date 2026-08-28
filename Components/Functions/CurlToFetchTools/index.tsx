'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { curlToFetch } from './logic';

export const CurlToFetch = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(decodeURIComponent(from));
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      setToValue(curlToFetch(fromValue));
    } catch (e: unknown) {
      setToValue('// Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      backColor="sky"
      title="Curl to Fetch Converter"
      description="Convert a [1curl2] command to a JavaScript [1fetch()2] call with async/await. Supports -X method, -H headers, -d body, -u auth, and common curl flags."
      fromTitle="curl Command"
      toTitle="fetch() Code"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
