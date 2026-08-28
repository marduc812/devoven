'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { validateXml, formatXmlValidation, prettyPrintXml } from './logic';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

type Mode = 'validate' | 'pretty';

export function XmlValidator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('validate');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode') as Mode;
    if (m) setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'validate') {
      const result = validateXml(input);
      setOutput(formatXmlValidation(result));
    } else {
      try {
        setOutput(prettyPrintXml(input));
      } catch (e) {
        setOutput(`Error: ${(e as Error).message}`);
      }
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="XML Validator"
      description="Validate XML documents and view error details, or pretty-print your XML for readability. For example, [1 <root><child/></root> 2] is valid XML with one element."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="XML Input"
      toTitle="Result"
      backColor="cyan"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className={selectClass}
        >
          <option value="validate">Validate</option>
          <option value="pretty">Pretty Print</option>
        </select>
      }
    />
  );
}
