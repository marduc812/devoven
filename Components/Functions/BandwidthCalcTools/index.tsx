'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseBandwidthInput, formatBandwidthResult } from './logic';

export function BandwidthCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const parsed = parseBandwidthInput(input);
      setOutput(
        formatBandwidthResult(
          parsed.fileSizeValue,
          parsed.fileSizeUnit,
          parsed.bandwidthValue,
          parsed.bandwidthUnit,
        ),
      );
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Bandwidth Calculator"
      description="Enter [1 file size 2] (e.g. 700 MB) and [1 bandwidth 2] (e.g. 10 Mbps) — one per line. Units: KB/MB/GB/TB and Kbps/Mbps/Gbps. Shows transfer time plus a reference table for common connection speeds."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="File Size / Bandwidth (one per line)"
      toTitle="Results"
      backColor="lime"
    />
  );
}
