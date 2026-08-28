'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { buildDohQuery, DOH_RECORD_TYPES, validateDomain, DohRecordType } from './logic';

export function DohSimulator() {
  const [domain, setDomain] = useState('example.com');
  const [recordType, setRecordType] = useState<DohRecordType>('A');
  const [activeTab, setActiveTab] = useState<'urls' | 'curl' | 'response' | 'protocol'>('urls');

  useEffect(function() {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setDomain(from);
    const type = params.get('type') as DohRecordType;
    if (type && DOH_RECORD_TYPES.indexOf(type) >= 0) setRecordType(type);
  }, []);

  const domainError = domain.trim() ? validateDomain(domain) : null;
  let result = null;
  if (domain.trim() && !domainError) {
    try {
      result = buildDohQuery(domain, recordType);
    } catch (_e) {
      // handled below
    }
  }

  const inputClass = 'bg-white text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const selectClass = 'bg-white text-gray-900 p-3 border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
  const codeClass = 'bg-gray-100 p-4 border border-gray-200 text-gray-200 font-mono text-xs whitespace-pre-wrap break-all leading-relaxed';

  const tabBtnClass = (tab: string) =>
    'px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ' +
    (activeTab === tab
      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
      : 'text-gray-500 hover:text-gray-300 border border-transparent');

  const content = (
    <div className="flex flex-col gap-5">
      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Domain Name</label>
          <input
            className={inputClass}
            value={domain}
            onChange={function(e) { setDomain(e.target.value); }}
            placeholder="e.g. example.com"
          />
          {domainError && (
            <span className="text-red-600 text-xs">{domainError}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Record Type</label>
          <select
            className={selectClass}
            value={recordType}
            onChange={function(e) { setRecordType(e.target.value as DohRecordType); }}
          >
            {DOH_RECORD_TYPES.map(function(t) {
              return <option key={t} value={t}>{t}</option>;
            })}
          </select>
        </div>
      </div>

      {result && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button className={tabBtnClass('urls')} onClick={function() { setActiveTab('urls'); }}>DoH URLs</button>
            <button className={tabBtnClass('curl')} onClick={function() { setActiveTab('curl'); }}>cURL Examples</button>
            <button className={tabBtnClass('response')} onClick={function() { setActiveTab('response'); }}>JSON Format</button>
            <button className={tabBtnClass('protocol')} onClick={function() { setActiveTab('protocol'); }}>About DoH</button>
          </div>

          {activeTab === 'urls' && (
            <div className="flex flex-col gap-3">
              {result.providers.map(function(p) {
                return (
                  <div key={p.provider} className="flex flex-col gap-1.5 border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sky-300 text-sm font-semibold">{p.provider}</span>
                    </div>
                    <span className="text-gray-500 text-xs mb-2">{p.description}</span>
                    <label className="text-gray-500 text-xs uppercase tracking-wider">GET (JSON API)</label>
                    <code className="text-gray-200 font-mono text-xs bg-white p-2 break-all border border-gray-200">{p.getUrl}</code>
                    <label className="text-gray-500 text-xs uppercase tracking-wider mt-1">Wire Format (POST)</label>
                    <code className="text-gray-400 font-mono text-xs bg-white p-2 break-all border border-gray-200">{p.wireformatUrl}</code>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>cURL Examples</label>
              <pre className={codeClass}>{result.curlExample}</pre>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Example JSON Response ({result.type} record)</label>
              <pre className={codeClass}>{result.jsonResponseFormat}</pre>
              <div className="text-gray-500 text-xs mt-1">
                Status 0 = NOERROR. Answer TTL is in seconds. Type field uses numeric DNS type codes.
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>DNS-over-HTTPS Protocol</label>
              <pre className={codeClass}>{result.protocol}</pre>
            </div>
          )}
        </>
      )}

      {!domain.trim() && (
        <div className="text-gray-600 text-sm">
          Enter a domain name above to build DoH query URLs for Cloudflare, Google, and NextDNS.
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="DoH Query Builder"
      description="Build DNS-over-HTTPS (DoH) query URLs for [1 Cloudflare 2], [1 Google 2], and [1 NextDNS 2]. Select a record type (A, AAAA, MX, TXT, CNAME, NS, SOA) and get ready-to-use URLs, cURL examples, and JSON response format. No actual DNS requests are made."
      backColor="sky"
      extraElements={content}
    />
  );
}
