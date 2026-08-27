'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { decodeSamlRequest, SAML_BINDINGS } from './logic';

export function SamlDecoder() {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'decoder' | 'bindings'>('decoder');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const result = input.trim() ? decodeSamlRequest(input) : null;

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full resize-none';
  const tabActive = 'px-3 py-1.5 text-sm bg-gray-900 text-white border-gray-900';
  const tabInactive = 'px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-200 transition-colors';

  return (
    <Panel
      title="SAML Request Decoder"
      description="Decode [1 base64-encoded SAML requests and responses 2]. Supports HTTP-Redirect (deflate+base64) and HTTP-POST (base64) bindings."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 flex-wrap">
            <button className={activeTab === 'decoder' ? tabActive : tabInactive} onClick={() => setActiveTab('decoder')}>Decoder</button>
            <button className={activeTab === 'bindings' ? tabActive : tabInactive} onClick={() => setActiveTab('bindings')}>Bindings</button>
          </div>

          {activeTab === 'decoder' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">SAMLRequest / SAMLResponse value (base64 or raw XML)</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="Paste a SAMLRequest query parameter value, SAMLResponse POST field, or raw XML..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              {result && (
                <div className="flex flex-col gap-4">
                  {result.warnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-amber-300 text-xs">{w}</p>
                      ))}
                    </div>
                  )}

                  {result.fields.length > 0 && (
                    <div>
                      <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Extracted Fields</label>
                      <div className="flex flex-col gap-2">
                        {result.fields.map((f, i) => (
                          <div key={i} className="border border-gray-200 bg-gray-50 px-4 py-3">
                            <div className="flex flex-wrap items-start gap-2">
                              <span className="text-gray-700 text-xs font-mono font-bold shrink-0">{f.name}</span>
                              <span className="text-gray-500 text-xs">{f.description}</span>
                            </div>
                            <code className="text-gray-200 text-xs font-mono break-all mt-1 block">{f.value}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.xmlPreview && (
                    <div>
                      <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">
                        {result.isXml ? 'Decoded XML' : 'Raw Output'}
                      </label>
                      <pre className="bg-gray-100 border border-gray-200 p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">{result.xmlPreview}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bindings' && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400 text-sm">SAML messages are transported using different <strong className="text-gray-900">bindings</strong> that define how to encode and transmit the XML data.</p>
              {SAML_BINDINGS.map(b => (
                <div key={b.name} className="border border-gray-200 bg-gray-50 p-4">
                  <p className="text-gray-900 text-sm font-semibold mb-1">{b.name}</p>
                  <p className="text-gray-300 text-sm mb-2">{b.description}</p>
                  <div className="flex flex-col gap-1">
                    <code className="text-gray-700 text-xs font-mono break-all">{b.encoding}</code>
                    <code className="text-gray-500 text-xs font-mono break-all">{b.example}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}
