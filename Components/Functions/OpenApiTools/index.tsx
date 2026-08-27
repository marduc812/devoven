'use client';

import React, { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateOpenApiSnippet } from './logic';

export const OpenApiSnippet = () => {
  const [fromValue, setFromValue] = useState('');
  const [mode, setMode] = useState<'yaml' | 'json'>('yaml');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    const result = generateOpenApiSnippet(fromValue);
    if (result.error) {
      toValue = `Error: ${result.error}`;
    } else {
      toValue = mode === 'yaml' ? result.yaml : result.json;
    }
  }

  const extraElements = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={mode}
      onChange={e => setMode(e.target.value as 'yaml' | 'json')}
    >
      <option value="yaml">OpenAPI YAML</option>
      <option value="json">OpenAPI JSON</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="OpenAPI Snippet Generator"
      description="Generate an [1 OpenAPI 3.0 2] YAML or JSON snippet from a simple endpoint description. Format: [1 GET /users/{id} 2] on the first line, then optional params:, body:, and response: lines."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Endpoint Description"
      toTitle="OpenAPI Snippet"
      extraElements={extraElements}
      backColor="lime"
    />
  );
};
