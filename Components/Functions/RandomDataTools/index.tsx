'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { processInput } from './logic';

export const RandomDataGenerator = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  const generate = () => {
    setError('');
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      setToValue(processInput(fromValue));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid command');
      setToValue('');
    }
  };

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm resize-none';
  const outputClass =
    'bg-gray-50 backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 font-mono text-sm resize-none';
  const btnClass =
    'px-4 py-2 bg-gray-900 text-white border-gray-900 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer';

  const examples = [
    '10 emails',
    '5 names',
    '3 phone numbers',
    '7 addresses',
    '20 words',
    '4 sentences',
    '6 UUIDs',
    '8 integers 1-100',
    '5 floats 0-1 4',
  ];

  return (
    <Panel
      title="Random Data Generator"
      description="Generate random test data by entering commands like [1 10 emails 2], [1 5 names 2], [1 6 UUIDs 2], [1 8 integers 1-100 2], or [1 5 floats 0-1 4 2]. One command per line."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-2">Commands (one per line)</label>
            <textarea
              className={textareaClass}
              rows={5}
              placeholder={'10 emails\n5 names\n6 UUIDs\n8 integers 1-100'}
              value={fromValue}
              onChange={e => setFromValue(e.target.value)}
            />
          </div>
          <div className="flex flex-row gap-2 flex-wrap">
            <button className={btnClass} onClick={generate}>Generate</button>
            {examples.map(ex => (
              <button
                key={ex}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 text-xs hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 cursor-pointer font-mono"
                onClick={() => {
                  setFromValue(prev => (prev ? prev + '\n' + ex : ex));
                }}
              >
                {ex}
              </button>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
          {toValue && (
            <div>
              <label className="text-gray-700 text-xs font-semibold uppercase tracking-wider block mb-2">Generated Data</label>
              <textarea
                className={outputClass}
                rows={10}
                value={toValue}
                readOnly
              />
            </div>
          )}
        </div>
      }
    />
  );
};
