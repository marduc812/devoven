'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { textToHexDump } from './logic';

export const HexViewer = () => {
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
    try {
      setToValue(textToHexDump(fromValue));
    } catch {
      setToValue(fromValue ? 'Error generating hex dump' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      backColor="yellow"
      title="Hex Viewer / Hex Dump"
      description="Convert text to a hex dump display similar to [1xxd2] output. Shows offset, 16 hex bytes per row, and an ASCII representation column. Useful for inspecting binary data and byte values."
      fromTitle="Text Input"
      toTitle="Hex Dump"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  );
};
