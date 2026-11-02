'use client';

import { useState, useEffect, type ReactNode } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { xmlToJson, jsonToXml, detectXmlOrJson } from './logic';

export function XmlJsonConverter({ article }: { article?: ReactNode } = {}) {
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
      article={article}
      title="XML to JSON converter"
      description={"Convert XML to JSON with attributes stored as [1 @name 2] fields and text as [1 _text 2] when needed. Repeated sibling elements become arrays. The direction selector also supports JSON input."}
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
