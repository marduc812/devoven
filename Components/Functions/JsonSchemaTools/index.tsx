'use client';

import { useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { validateSchema, formatValidationResult } from './logic';

export function JsonSchemaValidator() {
  const [schema, setSchema] = useState('{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number", "minimum": 0 }\n  }\n}');
  const [data, setData] = useState('{\n  "name": "Alice",\n  "age": 30\n}');
  const [output, setOutput] = useState('');

  function handleValidate() {
    const result = validateSchema(schema, data);
    setOutput(formatValidationResult(result));
  }

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wider mb-1';

  return (
    <Panel
      title="JSON Schema Validator"
      description="Validate a JSON document against a JSON Schema (draft-07). Enter your schema on the left and the data on the right, then click Validate."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <p className={labelClass}>Schema (JSON Schema)</p>
              <FileTextArea>
                <textarea
                  className={textareaClass}
                  rows={10}
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder="Enter JSON Schema..."
                />
              </FileTextArea>
            </div>
            <div className="flex flex-col gap-1">
              <p className={labelClass}>Data (JSON)</p>
              <FileTextArea>
                <textarea
                  className={textareaClass}
                  rows={10}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="Enter JSON data to validate..."
                />
              </FileTextArea>
            </div>
          </div>
          <button
            onClick={handleValidate}
            className="self-start bg-gray-100 hover:bg-gray-700 text-gray-700 border border-gray-300 px-4 py-1.5 text-sm transition-colors duration-200"
          >
            Validate
          </button>
          {output && (
            <div>
              <p className={labelClass}>Result</p>
              <pre
                className={`p-3 border border-gray-200 font-mono text-sm whitespace-pre-wrap ${
                  output.startsWith('✓')
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-red-500/10 text-red-300 border-red-500/20'
                }`}
              >
                {output}
              </pre>
            </div>
          )}
        </div>
      }
    />
  );
}
