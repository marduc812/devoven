'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateIcal, parseIcal, detectIcalOrInput } from './logic';

export function IcalGenerator() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'auto' | 'generate' | 'parse'>('auto');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const effectiveMode =
        mode === 'auto'
          ? (detectIcalOrInput(input) === 'ical' ? 'parse' : 'generate')
          : mode;
      if (effectiveMode === 'generate') {
        setOutput(generateIcal(input));
      } else {
        setOutput(parseIcal(input));
      }
    } catch (e: unknown) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error: invalid input');
    }
  }, [input, mode]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Mode:</span>
      <select
        className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={mode}
        onChange={e => setMode(e.target.value as 'auto' | 'generate' | 'parse')}
      >
        <option value="auto">Auto-detect</option>
        <option value="generate">key=value → iCal</option>
        <option value="parse">iCal → structured</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="iCal Event Generator"
      description="Generate [1iCalendar (.ics)2] VEVENT format from [1key=value lines2] (title, start, end, location, description, url, organizer, attendees). Parse dates as [1ISO 8601 or YYYY-MM-DD HH:MM2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (key=value or iCal)"
      toTitle="Output"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
