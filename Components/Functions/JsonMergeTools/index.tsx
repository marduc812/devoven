'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { TextInputPane } from '@/Components/View/FileInput';
import { mergeJsonStrings } from './logic';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1';
const textareaClass = 'w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 placeholder-gray-400 dark:placeholder-gray-600 resize-y min-h-[120px]';

export function JsonMergeTools() {
  const [json1, setJson1] = useState('');
  const [json2, setJson2] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!json1.trim() || !json2.trim()) { setResult(''); return; }
    try {
      setResult(mergeJsonStrings(json1.trim(), json2.trim()));
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    }
  }, [json1, json2]);

  const content = (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInputPane
          label="JSON Object 1"
          value={json1}
          onChange={setJson1}
          placeholder='{"name": "John", "age": 30}'
          accept=".json,application/json,.txt,text/plain"
        />
        <TextInputPane
          label="JSON Object 2"
          value={json2}
          onChange={setJson2}
          placeholder='{"age": 31, "city": "NYC"}'
          accept=".json,application/json,.txt,text/plain"
        />
      </div>

      <div>
        <label className={labelClass}>Merged Result</label>
        <textarea
          className={textareaClass}
          value={result}
          readOnly
          rows={8}
          spellCheck={false}
        />
      </div>
    </div>
  );

  return (
    <Panel
      title="JSON Merge"
      description="Deep merge two JSON objects. Nested objects are merged recursively; arrays and primitives from the second object overwrite the first."
      extraElements={content}
      backColor="cyan"
    />
  );
}
