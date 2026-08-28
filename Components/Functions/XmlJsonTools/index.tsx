'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { xmlToJson, jsonToXml, detectXmlOrJson } from './logic';

export function XmlJsonConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'auto' | 'xml-to-json' | 'json-to-xml'>('auto');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const effectiveDirection =
        direction === 'auto'
          ? (detectXmlOrJson(input) === 'xml' ? 'xml-to-json' : 'json-to-xml')
          : direction;
      if (effectiveDirection === 'xml-to-json') {
        setOutput(xmlToJson(input));
      } else {
        setOutput(jsonToXml(input));
      }
    } catch (e: unknown) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error: invalid input');
    }
  }, [input, direction]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Direction:</span>
      <select
        className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={direction}
        onChange={e => setDirection(e.target.value as 'auto' | 'xml-to-json' | 'json-to-xml')}
      >
        <option value="auto">Auto-detect</option>
        <option value="xml-to-json">XML → JSON</option>
        <option value="json-to-xml">JSON → XML</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="XML / JSON Converter"
      description="Convert between XML and JSON formats. XML attributes become [1@attr fields2], text content becomes [1_text field2], repeated elements become [1arrays2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (XML or JSON)"
      toTitle="Output"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}
