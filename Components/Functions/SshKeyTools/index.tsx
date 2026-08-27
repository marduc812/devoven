'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseSshPublicKey } from './logic';

const SAMPLE = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl user@example.com';

export const SshKeyInfo = () => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || '';
      if (from) setInput(from);
    }
  }, []);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { info: parseSshPublicKey(input), error: null };
    } catch (e: unknown) {
      return { info: null, error: e instanceof Error ? e.message : 'Invalid SSH public key' };
    }
  }, [input]);

  const info = result?.info ?? null;
  const error = result?.error ?? null;

  const keyTypeLabel: Record<string, string> = {
    'ssh-ed25519': 'Ed25519',
    'ssh-ed448': 'Ed448',
    'ssh-rsa': 'RSA',
    'ssh-dss': 'DSA',
  };

  const securityLevel = (keyType: string, bits: number | null): { label: string; color: string } => {
    if (keyType === 'ssh-ed25519' || keyType === 'ssh-ed448') return { label: 'Strong', color: 'text-emerald-700' };
    if (keyType.startsWith('ecdsa-sha2-')) return { label: bits && bits >= 384 ? 'Strong' : 'Adequate', color: bits && bits >= 384 ? 'text-emerald-700' : 'text-amber-600' };
    if (keyType === 'ssh-rsa') {
      if (!bits) return { label: 'Unknown', color: 'text-gray-500' };
      if (bits >= 4096) return { label: 'Strong', color: 'text-emerald-700' };
      if (bits >= 2048) return { label: 'Adequate', color: 'text-amber-600' };
      return { label: 'Weak', color: 'text-red-600' };
    }
    return { label: 'Unknown', color: 'text-gray-500' };
  };

  return (
    <Panel
      title="SSH Key Info"
      description="Parse an SSH public key to extract key type, bit size, and comment. Paste a public key from your [1 ~/.ssh/id_rsa.pub 2] or [1 ~/.ssh/id_ed25519.pub 2] file."
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">SSH Public Key</label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-xs resize-y min-h-[80px]"
              placeholder="ssh-ed25519 AAAA... user@host"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors duration-100 cursor-pointer self-start"
            onClick={() => setInput(SAMPLE)}
          >
            Load Sample
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {error}
            </div>
          )}

          {info && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Key Type</p>
                  <p className="text-xl font-black text-gray-900 font-mono">
                    {keyTypeLabel[info.keyType] ?? info.keyType}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{info.keyType}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Bit Size</p>
                  <p className="text-xl font-black text-gray-900 font-mono">
                    {info.bitSize !== null ? `${info.bitSize}` : 'N/A'}
                  </p>
                  {info.bitSize !== null && <p className="text-xs text-gray-400 mt-0.5">bits</p>}
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Security</p>
                  {(() => {
                    const sec = securityLevel(info.keyType, info.bitSize);
                    return (
                      <p className={`text-xl font-black ${sec.color}`}>{sec.label}</p>
                    );
                  })()}
                </div>
              </div>

              {/* Details table */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Comment', info.comment || '(none)'],
                      ['Blob Size', `${info.blobLength} bytes`],
                      ['Segments', info.parts.join(', ')],
                    ].map(([label, value], i) => (
                      <tr key={label} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-32">{label}</td>
                        <td className="px-4 py-2 text-gray-900 text-sm font-mono">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Full public key */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Full Public Key</p>
                <div
                  className="border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700 break-all cursor-pointer hover:bg-gray-100 transition-colors duration-100"
                  onClick={() => navigator.clipboard.writeText(info.raw)}
                  title="Click to copy"
                >
                  {info.raw}
                </div>
              </div>
            </>
          )}

          {!input.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Paste an SSH public key above</p>
          )}
        </div>
      }
    />
  );
};
