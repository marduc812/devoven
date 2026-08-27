'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { parseEnvFile } from './logic';

export const EnvParser = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [outputMode, setOutputMode] = useState<'json' | 'summary' | 'keys'>('json');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      const result = parseEnvFile(fromValue);

      if (outputMode === 'json') {
        setToValue(result.jsonOutput);
      } else if (outputMode === 'keys') {
        setToValue(result.entries.map(e => e.key).join('\n'));
      } else {
        // summary
        const lines: string[] = [
          'Variables: ' + result.entries.length,
          'Comment lines: ' + result.commentLines,
          'Empty lines: ' + result.emptyLines,
          'Total lines: ' + result.totalLines,
          '',
        ];
        if (result.duplicateKeys.length > 0) {
          lines.push('DUPLICATE KEYS: ' + result.duplicateKeys.join(', '));
          lines.push('');
        }
        if (result.issues.length > 0) {
          lines.push('Issues (' + result.issues.length + '):');
          for (const issue of result.issues) {
            lines.push((issue.severity === 'error' ? '[ERROR] ' : '[WARN]  ') + issue.message);
          }
        } else {
          lines.push('No issues found.');
        }
        setToValue(lines.join('\n'));
      }
    } catch (e) {
      setToValue('Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue, outputMode]);

  const modeBtn = (mode: 'json' | 'summary' | 'keys', label: string) => (
    <button
      key={mode}
      onClick={() => setOutputMode(mode)}
      className={`px-3 py-1 text-xs transition-all ${
        outputMode === mode
          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
          : 'bg-white/5 text-gray-400 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AdvancedConverter
      title="Env Variable Parser"
      description="Parse .env files with full support for quoted values, comments, [1 export 2] prefix, backslash line continuation, and inline comments. Detect issues like empty values, duplicate keys, and invalid key names."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle=".env File Contents"
      toTitle="Parsed Output"
      backColor="lime"
      extraElements={
        <div className="flex gap-2 flex-wrap">
          {modeBtn('json', 'JSON')}
          {modeBtn('summary', 'Summary')}
          {modeBtn('keys', 'Keys Only')}
        </div>
      }
    />
  );
};
