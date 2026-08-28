'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertUnitToText } from './logic';

export function UnitConverterExtended() {
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
      setOutput(convertUnitToText(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Unit Converter Extended"
      description="Convert any unit by typing a value and unit name, e.g. [1 100 mph 2], [1 30 celsius 2], [1 5 kWh 2], or [1 1 atm 2]. Auto-detects the category (length, mass, temperature, speed, pressure, energy, power) and shows all conversions."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Value + Unit (e.g. 100 mph)"
      toTitle="All Conversions"
      backColor="cyan"
    />
  );
}
