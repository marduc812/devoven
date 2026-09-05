'use client';

import React, { useEffect, useState } from 'react';
import { FileDropZone, LoadFileButton } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseRsaKeyInfo, formatRsaKeyInfo, type RsaKeyInfo as RsaKeyInfoData } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SAMPLE_RSA_PUBLIC = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMOST/DNt9VFuJeaE7h4zWNJKvL7tNEF3DFDxNOe2nWnHh4IrE8N
XTNdDFlVGMSqV5JFAZ6qNyIRVwMnS2PZXH7hEhDdPdEgT8E7kETX3HkNxMO7
gAGLJVvq7Hv6dU8LCzJZQmhUz59AEqI3Hw6K5C0BbUjxYRVbLJaZAgMBAAE=
-----END RSA PUBLIC KEY-----`;

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="border-b border-gray-200 py-2 last:border-0">
    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
    <div className="text-sm text-gray-900 font-mono break-all">{value}</div>
  </div>
);

export const RsaKeyInfo = () => {
  const [input, setInput] = useState('');
  const [info, setInfo] = useState<RsaKeyInfoData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = searchParams.get('from') ?? '';
    if (from) setInput(decodeURIComponent(from));
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) {
      setInfo(null);
      setError('');
      return;
    }
    try {
      const result = parseRsaKeyInfo(input);
      if (result.keyType === 'UNKNOWN') {
        setError('No valid PEM header found. Make sure to include the -----BEGIN ... ----- lines.');
        setInfo(null);
      } else {
        setInfo(result);
        setError('');
      }
    } catch (e: unknown) {
      setInfo(null);
      setError(e instanceof Error ? e.message : 'Failed to parse key');
    }
  }, [input]);

  const typeColors: Record<string, string> = {
    'RSA PUBLIC KEY': 'bg-green-50 text-green-700 border-green-200',
    'PUBLIC KEY': 'bg-green-50 text-green-700 border-green-200',
    'RSA PRIVATE KEY': 'bg-red-500/20 text-red-300 border-red-500/40',
    'PRIVATE KEY': 'bg-red-500/20 text-red-300 border-red-500/40',
    'CERTIFICATE': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'EC PRIVATE KEY': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'CERTIFICATE REQUEST': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  const bitColors = (bits: number | null): string => {
    if (!bits) return '';
    if (bits < 1024) return 'text-red-400';
    if (bits < 2048) return 'text-orange-400';
    if (bits >= 4096) return 'text-green-700';
    return 'text-yellow-400';
  };

  return (
    <Panel
      backColor="lime"
      title="RSA Key Info Parser"
      description="Paste a PEM-encoded RSA public key, private key, certificate, or EC key to inspect its type, size, modulus, exponent, and ASN.1 structure. All parsing happens in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">PEM Key Input</label>
              <button
                className="text-xs text-gray-700 hover:text-gray-700 transition-colors"
                onClick={() => setInput(SAMPLE_RSA_PUBLIC)}
              >
                Load Sample
              </button>
              <LoadFileButton onText={setInput} />
            </div>
            <FileDropZone onText={setInput}>
              <textarea
                className="bg-white text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none font-mono text-xs resize-none"
                rows={8}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste -----BEGIN RSA PUBLIC KEY-----, -----BEGIN CERTIFICATE-----, or similar..."
                spellCheck={false}
              />
            </FileDropZone>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3">
              {error}
            </div>
          )}

          {info && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold border ${typeColors[info.keyType] || 'bg-gray-500/20 text-gray-700 border-gray-500/40'}`}>
                  {info.label}
                </span>
                <span className="text-xs text-gray-400">{info.derBytes} bytes DER</span>
                {info.estimatedBits !== null && (
                  <span className={`text-sm font-bold font-mono ${bitColors(info.estimatedBits)}`}>
                    ~{info.estimatedBits} bits
                  </span>
                )}
              </div>

              <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col">
                <Field label="PEM Type" value={info.label} />
                <Field label="DER Size" value={`${info.derBytes} bytes`} />
                {info.estimatedBits !== null && (
                  <Field label="Estimated Key Size" value={`~${info.estimatedBits} bits`} />
                )}
                {info.exponentDecimal !== null && (
                  <Field label="Public Exponent" value={`${info.exponentDecimal} (0x${info.exponentHex})`} />
                )}
                {info.modulusHex && (
                  <Field label="Modulus (hex, truncated)" value={info.modulusHex} />
                )}
              </div>

              {info.structure.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">ASN.1 Structure</div>
                  <pre className="bg-white border border-gray-200 p-3 text-xs text-gray-900 font-mono overflow-auto whitespace-pre">
                    {info.structure.join('\n')}
                  </pre>
                </div>
              )}

              {info.notes.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Analysis Notes</div>
                  <ul className="flex flex-col gap-1">
                    {info.notes.map((note, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2">
                        <span className="text-gray-700 shrink-0">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!info && !error && (
            <p className="text-gray-400 text-sm text-center py-4">
              Paste a PEM-encoded key above to inspect its structure
            </p>
          )}
        </div>
      }
    />
  );
};
