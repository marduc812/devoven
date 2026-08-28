'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatBarcode } from './logic';

export function BarcodeInfo() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(formatBarcode(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Barcode Decoder"
      description="Decode [1 EAN-13 2] and [1 UPC-A 2] barcodes. Validates the check digit, identifies GS1 prefix (country/company), and distinguishes ISBN-13, ISSN, and ISMN from standard EAN-13."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Barcode Number (12 or 13 digits)"
      toTitle="Barcode Information"
      backColor="lime"
    />
  );
}
