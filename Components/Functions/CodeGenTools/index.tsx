'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { jsonToPython, jsonToPythonDataclass, jsonToPhp, jsonToJava } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

// ─── JSON to Python ───────────────────────────────────────────────────────────

export function JsonToPython() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'dict' | 'dataclass'>('dict');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'dataclass') setMode('dataclass');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(mode === 'dict' ? jsonToPython(input) : jsonToPythonDataclass(input));
    } catch (e) {
      setOutput(`# Error: ${(e as Error).message}`);
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="JSON to Python"
      description="Convert JSON to Python dictionary syntax or a [1 @dataclass 2] definition. Select Dict for a plain dictionary or Dataclass for typed class output."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="JSON"
      toTitle="Python"
      backColor="lime"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'dict' | 'dataclass')}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="dict">Dict</option>
          <option value="dataclass">Dataclass</option>
        </select>
      }
    />
  );
}

// ─── JSON to PHP ──────────────────────────────────────────────────────────────

export function JsonToPhp() {
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
      setOutput(jsonToPhp(input));
    } catch (e) {
      setOutput(`// Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="JSON to PHP Array"
      description="Convert JSON to PHP associative array syntax. Objects become [1 [] 2] arrays, booleans become [1 true 2]/[1 false 2], and null becomes [1 null 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="JSON"
      toTitle="PHP"
      backColor="cyan"
    />
  );
}

// ─── JSON to Java ─────────────────────────────────────────────────────────────

export function JsonToJava() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [className, setClassName] = useState('Model');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const cn = params.get('class');
    if (cn) setClassName(cn);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ class: className })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(jsonToJava(input, className || 'Model'));
    } catch (e) {
      setOutput(`// Error: ${(e as Error).message}`);
    }
  }, [input, className]);

  return (
    <AdvancedConverter
      title="JSON to Java Class"
      description="Convert a JSON object to a Java POJO class with private fields, getters, and setters. Supports [1 String 2], [1 Integer 2], [1 Double 2], [1 Boolean 2], [1 List<Object> 2] types."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="JSON"
      toTitle="Java"
      backColor="cyan"
      extraElements={
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Class Name</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Model"
            className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-gray-900 w-36"
          />
        </div>
      }
    />
  );
}
