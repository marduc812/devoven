'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { tomlToJson } from './logic';

export const TomlToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(tomlToJson(fromValue));
    } catch (e: unknown) {
      setToValue(fromValue ? (e instanceof Error ? 'Error: ' + e.message : 'Invalid TOML') : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="TOML to JSON Converter"
      description="Convert [1 TOML 2] configuration format to [1 JSON 2]. Supports strings, integers, floats, booleans, arrays, inline tables, and sections."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="TOML"
      toTitle="JSON"
      swapLink="/converting/json-to-toml"
      backColor="cyan"
    />
  );
};
