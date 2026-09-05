'use client';

import React, { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { decodeWsFrame, formatFrameResult, OPCODES, CLOSE_CODES } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const WsFrameDecoder = () => {
  const [hexInput, setHexInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setHexInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: hexInput })

  const decode = () => {
    if (!hexInput.trim()) { setResult(''); setError(''); return; }
    try {
      const frame = decodeWsFrame(hexInput);
      setResult(formatFrameResult(frame));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decode error');
      setResult('');
    }
  };

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full resize-none';

  const extraElements = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Hex Bytes</label>
        <FileTextArea>
          <textarea
            rows={3}
            className={inputClass}
            placeholder="e.g. 81 05 48 65 6c 6c 6f"
            value={hexInput}
            onChange={e => setHexInput(e.target.value)}
          />
        </FileTextArea>
      </div>
      <button
        onClick={decode}
        className="px-4 py-2 bg-sky-600/30 border border-sky-500/40 text-sky-200 text-sm hover:bg-sky-600/50 transition-colors"
      >
        Decode Frame
      </button>
      {error && (
        <div className="text-red-600 text-sm font-mono bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </div>
      )}
      {result && (
        <pre className="bg-white text-gray-900 border border-gray-200 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto">
          {result}
        </pre>
      )}

      <div className="mt-4">
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Opcode Reference</div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(OPCODES).slice(0, 12).map(([code, label]) => (
            <div key={code} className="flex gap-2 text-xs font-mono">
              <span className="text-sky-400">0x{parseInt(code).toString(16).toUpperCase()}</span>
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Close Codes</div>
        <div className="overflow-auto max-h-48">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left pr-3 py-1">Code</th>
                <th className="text-left pr-3 py-1">Name</th>
                <th className="text-left py-1">Description</th>
              </tr>
            </thead>
            <tbody>
              {CLOSE_CODES.map(cc => (
                <tr key={cc.code} className="border-t border-gray-200">
                  <td className="text-sky-400 pr-3 py-1">{cc.code}</td>
                  <td className="text-gray-700 pr-3 py-1">{cc.name}</td>
                  <td className="text-gray-500 py-1">{cc.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Panel
      title="WebSocket Frame Decoder"
      description="Decode a [1 WebSocket 2] frame from hex bytes (RFC 6455). Parses FIN, RSV bits, opcode, MASK bit, payload length, masking key, and payload. Includes opcode and close code reference tables."
      extraElements={extraElements}
      backColor="sky"
    />
  );
};
