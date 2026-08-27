'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateGraphql } from './logic';

const EXAMPLE = `GET /users/{id}

RESPONSE:
{
  "id": "123",
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2024-01-15"
}`;

export function RestToGraphql() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(generateGraphql(input));
    } catch (e: unknown) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error: invalid input');
    }
  }, [input]);

  const extraElements = (
    <button
      className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 hover:border-gray-400 hover:text-gray-200 transition-colors"
      onClick={() => setInput(EXAMPLE)}
    >
      Load example
    </button>
  );

  return (
    <AdvancedConverter
      title="REST to GraphQL"
      description="Given a REST endpoint description ([1METHOD /path2], optional [1REQUEST:2] and [1RESPONSE:2] JSON), generate a GraphQL type definition, query or mutation, and a resolver skeleton."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="REST API Description"
      toTitle="GraphQL Output"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}
