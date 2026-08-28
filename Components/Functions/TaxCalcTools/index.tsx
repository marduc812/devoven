'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { parseTaxInput, formatTaxResult, TaxMode } from './logic';

export function TaxCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<TaxMode>('add');

  useEffect(() => {
    const p = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = p.get('from');
    if (from) setInput(from);
    const m = p.get('mode');
    if (m === 'add' || m === 'extract') setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const inputs = parseTaxInput(input, mode);
      setOutput(formatTaxResult(inputs));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, mode]);

  const modeSelector = (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span className="text-gray-500">Mode:</span>
      <select
        className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-white/30"
        value={mode}
        onChange={e => setMode(e.target.value as TaxMode)}
      >
        <option value="add">Add Tax to Price</option>
        <option value="extract">Extract Tax from Inclusive Price</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="VAT / Tax Calculator"
      description="Enter [1 amount 2] and [1 tax rate (%) 2] one per line. Choose mode: add tax to a net price, or extract tax from a tax-inclusive price. Includes a reference table of common VAT rates."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Amount / Tax Rate % (one per line)"
      toTitle="Results"
      backColor="lime"
      extraElements={modeSelector}
    />
  );
}
