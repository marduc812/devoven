'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { searchCiphers, lookupCipher, parseCipherName, type CipherSuiteInfo } from './logic';

export const TlsCipherDecoder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CipherSuiteInfo[]>([]);
  const [selected, setSelected] = useState<CipherSuiteInfo | null>(null);
  const [parsedFields, setParsedFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setQuery(from);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSelected(null);
      setParsedFields({});
      setResults(searchCiphers(''));
      return;
    }
    const found = lookupCipher(trimmed);
    if (found) {
      setSelected(found);
      setParsedFields(parseCipherName(trimmed));
      setResults([]);
    } else {
      setSelected(null);
      setParsedFields({});
      setResults(searchCiphers(trimmed));
    }
  }, [query]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';

  // Families globals.css remaps for the dark theme (emerald/indigo/amber/rose),
  // so these read in both themes rather than only on the light panel.
  const securityColors: Record<string, string> = {
    recommended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    acceptable: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    weak: 'bg-amber-50 text-amber-700 border-amber-200',
    insecure: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <Panel
      title="TLS Cipher Suite Decoder"
      description="Decode a TLS cipher suite name to see its key exchange, authentication, encryption, and MAC components. Search or paste a full name like [1 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 2]."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="Paste cipher name or search (e.g. TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          {selected && Object.keys(parsedFields).length > 0 && (
            <div className="border border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <code className="text-sky-700 text-sm font-mono font-bold break-all">{selected.name}</code>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold border ${securityColors[selected.security] || ''} whitespace-nowrap`}>
                  {selected.security}
                </span>
                {selected.forwardSecrecy && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200 whitespace-nowrap">
                    Forward Secrecy
                  </span>
                )}
                {selected.aead && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 whitespace-nowrap">
                    AEAD
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(parsedFields).map(([k, v]) => (
                  <div key={k} className="flex gap-3 border-b border-gray-200 pb-2">
                    <span className="text-gray-500 text-xs w-40 shrink-0 font-medium">{k}</span>
                    <span className="text-gray-900 text-xs font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selected && (
            <>
              <p className="text-gray-500 text-xs">{results.length} cipher suite{results.length !== 1 ? 's' : ''}</p>
              <div className="flex flex-col gap-2">
                {results.map(cs => (
                  <button
                    key={cs.name}
                    className="text-left border-b border-gray-200 pb-2 hover:bg-gray-50 rounded px-2 transition-colors"
                    onClick={() => setQuery(cs.name)}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <code className="text-sky-700 text-xs font-mono break-all">{cs.name}</code>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${securityColors[cs.security] || ''} whitespace-nowrap`}>
                        {cs.security}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">{cs.keyExchange} / {cs.authentication} · {cs.encryption}-{cs.keySize} {cs.mode} · {cs.mac}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
