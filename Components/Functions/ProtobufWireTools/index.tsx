'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { decodeProtobuf, formatProtobufResult, WIRE_TYPES } from './logic';

const EXAMPLES = [
  { label: 'Field 1 string "hello"', hex: '0a 05 68 65 6c 6c 6f' },
  { label: 'Field 1 varint 150', hex: '08 96 01' },
  { label: 'Field 2 varint 300 + field 1 string "test"', hex: '08 AC 02 12 04 74 65 73 74' },
  { label: 'Field 1 fixed32 (300)', hex: '0d 2c 01 00 00' },
];

export function ProtobufWireDecoder() {
  const [hexInput, setHexInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'decoder' | 'reference'>('decoder');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setHexInput(from);
  }, []);

  const decode = () => {
    if (!hexInput.trim()) { setResult(''); setError(''); return; }
    try {
      const decoded = decodeProtobuf(hexInput);
      setResult(formatProtobufResult(decoded));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decode error');
      setResult('');
    }
  };

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full resize-none';
  const tabActive = 'px-3 py-1.5 text-sm bg-gray-900 text-white border-gray-900';
  const tabInactive = 'px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 transition-colors';

  return (
    <Panel
      title="Protocol Buffer Wire Format"
      description="Decode [1 protobuf hex bytes 2] to reveal wire types, field numbers, varint encoding steps, and payload data."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 flex-wrap">
            <button className={activeTab === 'decoder' ? tabActive : tabInactive} onClick={() => setActiveTab('decoder')}>Decoder</button>
            <button className={activeTab === 'reference' ? tabActive : tabInactive} onClick={() => setActiveTab('reference')}>Wire Types</button>
          </div>

          {activeTab === 'decoder' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Hex Bytes</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="e.g. 0a 05 68 65 6c 6c 6f"
                  value={hexInput}
                  onChange={e => setHexInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={decode}
                  className="px-4 py-2 bg-gray-900 text-white border-gray-900 text-sm hover:bg-gray-700 transition-colors"
                >
                  Decode
                </button>
                {EXAMPLES.map(ex => (
                  <button
                    key={ex.label}
                    onClick={() => { setHexInput(ex.hex); setResult(''); setError(''); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-400 text-xs hover:text-gray-900 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-3">
                  <p className="text-red-400 text-sm font-mono">{error}</p>
                </div>
              )}

              {result && (
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Decoded Output</label>
                  <pre className="bg-gray-100 border border-gray-200 p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">{result}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reference' && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400 text-sm">Each protobuf field is prefixed with a <strong className="text-gray-700">tag</strong> byte (or varint) encoding the field number and wire type: <code className="text-gray-700 font-mono">tag = (field_number &lt;&lt; 3) | wire_type</code></p>
              <div className="flex flex-col gap-3">
                {Object.entries(WIRE_TYPES).map(([wt, info]) => (
                  <div key={wt} className="border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-gray-900 text-white border-gray-900 px-2 py-0.5 text-xs font-mono font-bold">Type {wt}</span>
                      <span className="text-gray-900 text-sm font-semibold">{info.name}</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-1">{info.description}</p>
                    <p className="text-gray-500 text-xs italic">Used for: {info.types}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 p-4">
                <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Varint encoding</p>
                <p className="text-gray-300 text-sm mb-2">Each byte contributes 7 data bits. The MSB (bit 7) is the continuation bit — if 1, more bytes follow.</p>
                <code className="text-gray-700 text-xs font-mono block">Example: 150 = 0x96 0x01</code>
                <code className="text-gray-400 text-xs font-mono block">0x96 → 1 0010110 (MSB=1, payload=0010110)</code>
                <code className="text-gray-400 text-xs font-mono block">0x01 → 0 0000001 (MSB=0, payload=0000001)</code>
                <code className="text-gray-400 text-xs font-mono block">value = 0010110 | (0000001 &lt;&lt; 7) = 10010110 = 150</code>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
