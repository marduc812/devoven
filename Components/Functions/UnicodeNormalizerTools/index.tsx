'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { normalizeText, getFormDescription, type NormalizationForm } from './logic';

export const UnicodeNormalizer = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [form, setForm] = useState<NormalizationForm>('NFC');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const f = params.get('form');
    if (f && ['NFC', 'NFD', 'NFKC', 'NFKD'].includes(f)) setForm(f as NormalizationForm);
  }, []);

  useEffect(() => {
    if (!input) { setOutput(''); return; }
    setOutput(normalizeText(input, form));
  }, [input, form]);

  return (
    <AdvancedConverter
      title="Unicode Normalizer"
      description="Normalize unicode text using [1 NFC 2], [1 NFD 2], [1 NFKC 2], or [1 NFKD 2] normalization forms."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Normalized Text"
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-2">
          <select
            value={form}
            onChange={e => setForm(e.target.value as NormalizationForm)}
            className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
          >
            <option value="NFC">NFC — Canonical Composition</option>
            <option value="NFD">NFD — Canonical Decomposition</option>
            <option value="NFKC">NFKC — Compatibility Composition</option>
            <option value="NFKD">NFKD — Compatibility Decomposition</option>
          </select>
          <p className="text-gray-500 text-xs">{getFormDescription(form)}</p>
        </div>
      }
    />
  );
};
