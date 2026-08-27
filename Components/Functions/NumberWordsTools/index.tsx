'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertNumberWords } from './logic';

export function NumberWords() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(convertNumberWords(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Number to Words (Ordinal)"
      description="Convert integers to their English ordinal form. For example, [1 42 2] becomes [1 forty-second 2]. Supports negative numbers and numbers up to 999 trillion."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Integer"
      toTitle="Ordinal Words"
      backColor="cyan"
    />
  );
}
