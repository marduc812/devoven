'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processQrData } from './logic';

export function QrDataDecoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(function() {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processQrData(input));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input]);

  return (
    <BasicConverter
      title="QR Data Analyzer"
      description="Paste the text content encoded in a QR code to identify its type and extract structured data. Supports [1 URLs 2], [1 vCard 2], [1 WiFi 2], [1 geo 2], [1 mailto 2], [1 tel 2], [1 SMSTO 2], and calendar events."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="QR Code Content"
      toTitle="Parsed Data"
      backColor="lime"
    />
  );
}
