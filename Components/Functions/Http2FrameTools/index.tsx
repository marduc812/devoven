'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  decodeHttp2Frames,
  FRAME_TYPES,
  ERROR_CODES,
  SAMPLE_HEX,
  type DecodeResult,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const frameTypeColor: Record<string, string> = {
  DATA: 'bg-sky-50 text-sky-700 border-sky-200',
  HEADERS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PRIORITY: 'bg-amber-50 text-amber-700 border-amber-200',
  RST_STREAM: 'bg-rose-50 text-rose-700 border-rose-200',
  SETTINGS: 'bg-purple-50 text-purple-700 border-purple-200',
  PUSH_PROMISE: 'bg-teal-50 text-teal-700 border-teal-200',
  PING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  GOAWAY: 'bg-red-50 text-red-700 border-red-200',
  WINDOW_UPDATE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  CONTINUATION: 'bg-lime-50 text-lime-700 border-lime-200',
  UNKNOWN: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const Http2FrameDecoder = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [tab, setTab] = useState<'decode' | 'reference'>('decode');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setResult(null); return; }
    const cleaned = input.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    setResult(decodeHttp2Frames(cleaned));
  }, [input]);

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
    }`;

  return (
    <Panel
      title="HTTP/2 Frame Decoder"
      description="Decode HTTP/2 frames from hex bytes (RFC 7540). Each frame has a 9-byte header: 24-bit length, 8-bit type, 8-bit flags, and 31-bit stream ID."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button className={tabClass(tab === 'decode')} onClick={() => setTab('decode')}>Decode</button>
            <button className={tabClass(tab === 'reference')} onClick={() => setTab('reference')}>Reference</button>
          </div>

          {tab === 'decode' && (
            <>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-xs resize-y min-h-[140px]"
                placeholder="Paste HTTP/2 frame hex bytes (spaces/newlines are ok, comments with // are skipped)..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer self-start"
                onClick={() => setInput(SAMPLE_HEX)}
              >
                Load Sample
              </button>

              {result && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{result.totalBytes} bytes total</span>
                    <span>·</span>
                    <span>{result.frames.length} frame{result.frames.length !== 1 ? 's' : ''}</span>
                  </div>

                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-600 text-xs font-mono">{err}</p>
                  ))}

                  {result.frames.map((frame, i) => (
                    <div key={i} className="border border-gray-200 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-400 text-xs font-mono">Frame {i + 1}</span>
                        <span className={`text-xs px-2 py-0.5 border font-mono font-bold ${frameTypeColor[frame.type]}`}>
                          {frame.type}
                        </span>
                        <span className="text-gray-400 text-xs font-mono">0x{frame.typeCode.toString(16).padStart(2, '0')}</span>
                      </div>

                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-1.5 pr-4 text-gray-400 text-xs font-bold uppercase tracking-wider w-28">Length</td>
                            <td className="py-1.5 text-gray-900 font-mono">{frame.length} bytes</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1.5 pr-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Flags</td>
                            <td className="py-1.5 font-mono">
                              <span className="text-gray-900">0x{frame.flags.toString(16).padStart(2, '0')}</span>
                              {frame.flagNames.length > 0 && (
                                <span className="text-gray-500 ml-2">({frame.flagNames.join(', ')})</span>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-1.5 pr-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Stream ID</td>
                            <td className="py-1.5 text-gray-900 font-mono">
                              {frame.streamId} {frame.streamId === 0 ? <span className="text-gray-400">(connection-level)</span> : ''}
                            </td>
                          </tr>
                          {frame.payloadHex && (
                            <tr className="border-b border-gray-200">
                              <td className="py-1.5 pr-4 text-gray-400 text-xs font-bold uppercase tracking-wider align-top">Payload</td>
                              <td className="py-1.5 text-gray-500 font-mono break-all text-xs">
                                {frame.payloadHex.length > 80 ? frame.payloadHex.substring(0, 80) + '...' : frame.payloadHex}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {frame.payloadInterpretation && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Interpretation</p>
                          <pre className="text-gray-900 text-xs font-mono whitespace-pre-wrap bg-gray-50 border border-gray-200 p-2">{frame.payloadInterpretation}</pre>
                        </div>
                      )}

                      {frame.errors.map((err, j) => (
                        <p key={j} className="text-red-600 text-xs font-mono">{err}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'reference' && (
            <div className="flex flex-col gap-5">
              {/* Frame types */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Frame Types</p>
                <div className="border border-gray-200 overflow-hidden">
                  {FRAME_TYPES.map((ft, i) => (
                    <div key={ft.code} className={`p-4 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-400 font-mono text-xs">0x{ft.code.toString(16)}</span>
                        <span className={`text-xs px-2 py-0.5 border font-mono font-bold ${frameTypeColor[ft.name]}`}>
                          {ft.name}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{ft.description}</p>
                      {ft.flags.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Flags</p>
                          {ft.flags.map(flag => (
                            <p key={flag.bit} className="text-gray-500 text-xs">
                              <span className="text-amber-700 font-mono">0x{flag.bit.toString(16)}</span>
                              {' '}<span className="text-gray-900 font-bold">{flag.name}</span>
                              {' '}— {flag.description}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error codes */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Error Codes</p>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(ERROR_CODES).map(([code, meaning], i) => (
                        <tr key={code} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-3 py-2 font-mono text-red-700 font-bold">0x{parseInt(code, 10).toString(16).padStart(2, '0')}</td>
                          <td className="px-3 py-2 text-gray-700">{meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Frame header structure */}
              <div className="border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Frame Header Structure (9 bytes)</p>
                <pre className="text-xs font-mono text-gray-900 bg-gray-50 border border-gray-200 p-3 whitespace-pre overflow-x-auto">{`+-----------------------------------------------+
|                 Length (24)                    |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                 Stream Identifier (31)                      |
+=+=============================================================+
|                   Frame Payload (0...)                      ...
+---------------------------------------------------------------+`}</pre>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
