'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { buildLdapQuery, validateLdapFilter, LDAP_OPERATORS, LDAP_EXAMPLES } from './logic';
import { UNPARSED_WARNING_PREFIX } from './parse';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function LdapQueryBuilder() {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'operators' | 'examples'>('builder');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = buildLdapQuery(input);
  const validationError = result.filter ? validateLdapFilter(result.filter) : null;
  // The unparsed spans get their own block, so drop their duplicate warnings.
  const otherWarnings = result.warnings.filter(w => !w.startsWith(UNPARSED_WARNING_PREFIX));

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full resize-none';
  const tabActive = 'px-3 py-1.5 text-sm bg-gray-900 text-white border-gray-900';
  const tabInactive = 'px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors';
  const labelClass = 'text-gray-500 text-xs uppercase tracking-wider mb-1 block';

  return (
    <Panel
      title="LDAP Query Builder"
      description="Build LDAP filter syntax from a [1 natural language description 2]. Supports objectClass, cn, department, email, group membership, and account status filters."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 flex-wrap">
            <button className={activeTab === 'builder' ? tabActive : tabInactive} onClick={() => setActiveTab('builder')}>Builder</button>
            <button className={activeTab === 'operators' ? tabActive : tabInactive} onClick={() => setActiveTab('operators')}>Operators</button>
            <button className={activeTab === 'examples' ? tabActive : tabInactive} onClick={() => setActiveTab('examples')}>Examples</button>
          </div>

          {activeTab === 'builder' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Describe your query</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder='e.g. "find users in IT department named John" or "active users with email @example.com"'
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              {result.filter && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Generated LDAP Filter</label>
                    <div className="bg-gray-100 border border-gray-200 px-4 py-3">
                      <code className="text-gray-900 text-sm font-mono break-all">{result.filter}</code>
                    </div>
                    {validationError && (
                      <p className="text-rose-700 text-xs mt-1">{validationError}</p>
                    )}
                  </div>

                  {result.explanation.length > 0 && (
                    <div>
                      <label className={labelClass}>Explanation</label>
                      <ul className="flex flex-col gap-1">
                        {result.explanation.map((line, i) => (
                          <li key={i} className="text-gray-700 text-sm flex gap-2">
                            <span className="text-emerald-700 mt-0.5">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.unparsed.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                      <p className="text-amber-700 text-xs font-semibold mb-1">
                        Not understood — these words were ignored:
                      </p>
                      <p className="text-amber-700 text-xs font-mono break-all">
                        {result.unparsed.map(u => `"${u}"`).join('  ')}
                      </p>
                    </div>
                  )}

                  {otherWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                      {otherWarnings.map((w, i) => (
                        <p key={i} className="text-amber-700 text-xs">{w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'operators' && (
            <div className="flex flex-col gap-3">
              {LDAP_OPERATORS.map(op => (
                <div key={op.symbol} className="border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-gray-700 font-mono font-bold text-lg">{op.symbol}</code>
                    <span className="text-gray-900 text-sm font-semibold">{op.name}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{op.description}</p>
                  <code className="text-gray-700 text-xs font-mono">{op.example}</code>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="flex flex-col gap-3">
              {LDAP_EXAMPLES.map(ex => (
                <div
                  key={ex.label}
                  className="border border-gray-200 bg-gray-50 p-4 cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => { setInput(ex.description); setActiveTab('builder'); }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-900 text-sm font-semibold">{ex.label}</span>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{ex.description}</p>
                  <code className="text-gray-700 text-xs font-mono break-all">{ex.filter}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}
