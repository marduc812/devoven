'use client';

import React, { useEffect, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeChain, type ChainAnalysis } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SAMPLE = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJemfuCopMEeMA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNVBAMTF0V4
YW1wbGUgUm9vdCBDQSBFeGFtcGxlMB4XDTIzMDEwMTAwMDAwMFoXDTI0MDEwMTAw
MDAwMFowIjEgMB4GA1UEAxMXRXhhbXBsZSBSb290IENBIEV4YW1wbGUwXDANBgkq
hkiG9w0BAQEFAANLADBIAkEA2a2rwplBQLF29amygykEMmYz0+Kcj3bKBp29E4kD
Dx8kAqnphE8wr18OEWBRqe0IYRRFwFNjnpWVk3xFnpLhkwIDAQABMA0GCSqGSIb3
DQEBCwUAA0EAMFa+jzbpDMNVLCi9VZeKIiIPMFpYkOjEk8r0GxFCEXy+0BePSQ8M
XpNjmrjuDpSrgDDmkX5HUdTBzRj5j8YqJA==
-----END CERTIFICATE-----`;

const roleBadge: Record<string, string> = {
  leaf: 'bg-sky-50 text-sky-700 border-sky-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  root: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const CertChainAnalyzer = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ChainAnalysis | null>(null);

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
    setResult(analyzeChain(input));
  }, [input]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-xs resize-y min-h-[180px]';

  const ordered = result ? result.ordered : [];
  const certs = result ? result.certs : [];

  return (
    <Panel
      title="Certificate Chain Analyzer"
      description="Paste multiple PEM certificates to analyze the chain: leaf, intermediate, and root. Checks issuer/subject matching to verify the chain order."
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-4">
          <FileTextArea>
            <textarea
              className={inputClass}
              placeholder="Paste one or more PEM certificates here..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </FileTextArea>
          <button
            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors duration-100 cursor-pointer self-start"
            onClick={() => setInput(SAMPLE)}
          >
            Load Sample
          </button>

          {result && result.errors.length > 0 && (
            <div className="flex flex-col gap-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-red-600 text-xs font-mono">{err}</p>
              ))}
            </div>
          )}

          {result && certs.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 border ${result.isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {result.isComplete ? 'Chain appears complete' : 'Chain may be incomplete'}
                </span>
                <span className="text-gray-500 text-xs">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Chain Order (Leaf → Root)</p>

              {ordered.map((idx, pos) => {
                const cert = certs[idx];
                return (
                  <div key={idx} className="relative flex flex-col gap-2 p-4 border border-gray-200 bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 text-xs font-mono">#{pos + 1}</span>
                      <span className={`text-xs px-2 py-0.5 border ${roleBadge[cert.role]}`}>
                        {cert.role}
                      </span>
                      {cert.selfSigned && (
                        <span className="text-xs px-2 py-0.5 border bg-purple-50 text-purple-700 border-purple-200">
                          self-signed
                        </span>
                      )}
                      {cert.chainsTo !== null && (
                        <span className="text-xs text-gray-500">
                          chains to cert #{ordered.indexOf(cert.chainsTo) + 1}
                        </span>
                      )}
                      {cert.role !== 'root' && cert.chainsTo === null && !cert.selfSigned && (
                        <span className="text-xs px-2 py-0.5 border bg-rose-50 text-rose-700 border-rose-200">
                          no issuer found
                        </span>
                      )}
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap w-24">Subject</td>
                          <td className="py-1.5 text-gray-900 font-mono break-all">{cert.subject}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">Issuer</td>
                          <td className="py-1.5 text-gray-900 font-mono break-all">{cert.issuer}</td>
                        </tr>
                        {cert.notBefore && (
                          <tr className="border-b border-gray-200">
                            <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">Not Before</td>
                            <td className="py-1.5 text-gray-900 font-mono">{cert.notBefore}</td>
                          </tr>
                        )}
                        {cert.notAfter && (
                          <tr>
                            <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">Not After</td>
                            <td className="py-1.5 text-gray-900 font-mono">{cert.notAfter}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
    />
  );
};
