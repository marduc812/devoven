'use client';

import React, { useEffect, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { buildRawRequest, HttpMethod } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const HttpRequestBuilder = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headersRaw, setHeadersRaw] = useState('Content-Type: application/json\nAccept: application/json');
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState<'raw' | 'curl' | 'fetch'>('raw');
  const [output, setOutput] = useState({ rawRequest: '', curlCommand: '', fetchCode: '' });

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from') || '';
    if (from) setUrl(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: url })

  useEffect(() => {
    if (!url.trim()) { setOutput({ rawRequest: '', curlCommand: '', fetchCode: '' }); return; }
    try {
      const result = buildRawRequest({ method, url, headersRaw, body, httpVersion: '1.1' });
      setOutput(result);
    } catch (e) {
      const msg = 'Error: ' + (e instanceof Error ? e.message : 'Invalid input');
      setOutput({ rawRequest: msg, curlCommand: msg, fetchCode: msg });
    }
  }, [method, url, headersRaw, body]);

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y';

  const methodColors: Record<HttpMethod, string> = {
    GET:     'bg-emerald-600 text-white border-emerald-600',
    POST:    'bg-blue-600 text-white border-blue-600',
    PUT:     'bg-amber-500 text-white border-amber-500',
    PATCH:   'bg-orange-500 text-white border-orange-500',
    DELETE:  'bg-red-600 text-white border-red-600',
    HEAD:    'bg-purple-600 text-white border-purple-600',
    OPTIONS: 'bg-gray-600 text-white border-gray-600',
  };

  const currentOutput = activeTab === 'raw' ? output.rawRequest : activeTab === 'curl' ? output.curlCommand : output.fetchCode;

  return (
    <Panel
      title="HTTP Request Builder"
      description="Build and format HTTP requests as raw HTTP/1.1, curl command, or JavaScript fetch() code. Select a method, enter a URL and optional headers and body."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-5 w-full">

          {/* Method */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Method</label>
            <div className="flex flex-wrap gap-1.5">
              {HTTP_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold border transition-colors duration-150 ${
                    method === m
                      ? methodColors[m]
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">URL</label>
            <input
              type="text"
              className={inputClass}
              placeholder="https://api.example.com/v1/users"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          {/* Headers */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Headers <span className="font-normal normal-case tracking-normal text-gray-400">(one per line, Name: Value)</span></label>
            <FileTextArea>
              <textarea
                className={inputClass}
                rows={4}
                placeholder={"Content-Type: application/json\nAuthorization: Bearer token"}
                value={headersRaw}
                onChange={e => setHeadersRaw(e.target.value)}
              />
            </FileTextArea>
          </div>

          {/* Body */}
          {method !== 'GET' && method !== 'HEAD' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Body</label>
              <FileTextArea>
                <textarea
                  className={inputClass}
                  rows={4}
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </FileTextArea>
            </div>
          )}

          {/* Output */}
          {currentOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1.5">
                {(['raw', 'curl', 'fetch'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold border transition-colors duration-150 ${
                      activeTab === tab
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'raw' ? 'Raw HTTP' : tab === 'curl' ? 'curl' : 'fetch()'}
                  </button>
                ))}
              </div>
              <textarea
                className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-xs"
                rows={10}
                value={currentOutput}
                readOnly
              />
            </div>
          )}

          {!url.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">
              Enter a URL to generate the HTTP request.
            </p>
          )}
        </div>
      }
    />
  );
};
