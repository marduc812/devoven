'use client';

import React, { useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  buildSetCookieHeader,
  analyzeSetCookie,
  parseSetCookieString,
  type CookieAttributes,
} from './logic';

export const SetCookieBuilder = () => {
  const [mode, setMode] = useState<'build' | 'parse'>('build');

  // Build mode state
  const [attrs, setAttrs] = useState<CookieAttributes>({
    name: 'session',
    value: 'abc123',
    path: '/',
    domain: '',
    maxAge: '3600',
    expires: '',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  });

  // Parse mode state
  const [rawCookie, setRawCookie] = useState('');

  const update = (patch: Partial<CookieAttributes>) =>
    setAttrs(prev => ({ ...prev, ...patch }));

  const built = buildSetCookieHeader(attrs);
  const analysis = analyzeSetCookie(attrs);
  const parsed = mode === 'parse' && rawCookie.trim() ? parseSetCookieString(rawCookie) : null;

  const inputClass =
    'bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-gray-900 px-2 py-1 text-sm font-mono w-full';
  const btnClass =
    'px-3 py-1.5 text-xs border border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors';
  const activeBtnClass =
    'px-3 py-1.5 text-xs border border-emerald-500/50 bg-emerald-500/10 text-emerald-300';

  return (
    <Panel
      title="Set-Cookie Header Builder"
      description="Build a [1 Set-Cookie 2] header from attributes, or parse an existing Set-Cookie string. Includes security analysis for missing [1 HttpOnly 2], [1 Secure 2], and [1 SameSite 2] flags."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              className={mode === 'build' ? activeBtnClass : btnClass}
              onClick={() => setMode('build')}
            >
              Build
            </button>
            <button
              className={mode === 'parse' ? activeBtnClass : btnClass}
              onClick={() => setMode('parse')}
            >
              Parse
            </button>
          </div>

          {mode === 'build' && (
            <>
              {/* Name/Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Cookie Name</label>
                  <input
                    className={inputClass}
                    value={attrs.name}
                    onChange={e => update({ name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Cookie Value</label>
                  <input
                    className={inputClass}
                    value={attrs.value}
                    onChange={e => update({ value: e.target.value })}
                  />
                </div>
              </div>

              {/* Path/Domain */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Path</label>
                  <input
                    className={inputClass}
                    value={attrs.path}
                    onChange={e => update({ path: e.target.value })}
                    placeholder="/"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Domain</label>
                  <input
                    className={inputClass}
                    value={attrs.domain}
                    onChange={e => update({ domain: e.target.value })}
                    placeholder="example.com"
                  />
                </div>
              </div>

              {/* Max-Age / Expires */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Max-Age (seconds)</label>
                  <input
                    className={inputClass}
                    value={attrs.maxAge}
                    onChange={e => update({ maxAge: e.target.value })}
                    placeholder="3600"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs">Expires (ISO date)</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={attrs.expires}
                    onChange={e => update({ expires: e.target.value })}
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-2">
                {(['httpOnly', 'secure'] as const).map(flag => (
                  <button
                    key={flag}
                    className={attrs[flag] ? activeBtnClass : btnClass}
                    onClick={() => update({ [flag]: !attrs[flag] } as Partial<CookieAttributes>)}
                  >
                    {flag === 'httpOnly' ? 'HttpOnly' : 'Secure'}
                  </button>
                ))}
                {(['', 'Strict', 'Lax', 'None'] as CookieAttributes['sameSite'][]).map(s => (
                  <button
                    key={s || 'none-ss'}
                    className={attrs.sameSite === s ? activeBtnClass : btnClass}
                    onClick={() => update({ sameSite: s })}
                  >
                    {s ? `SameSite=${s}` : 'No SameSite'}
                  </button>
                ))}
              </div>

              {/* Output */}
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Generated Header
                </span>
                <textarea
                  readOnly
                  value={built}
                  rows={2}
                  className="bg-gray-50 text-gray-900 p-3 border border-gray-300 font-mono text-sm resize-y"
                />
              </div>

              {/* Security */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Security Score
                  </span>
                  <span
                    className={`text-xs font-mono ${analysis.score >= 80 ? 'text-emerald-400' : analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}
                  >
                    {analysis.score}/100
                  </span>
                </div>
                {analysis.warnings.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {analysis.warnings.map((w, i) => (
                      <li key={i} className="text-yellow-400 text-xs">
                        ⚠ {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-400 text-xs">No security issues found.</p>
                )}
              </div>
            </>
          )}

          {mode === 'parse' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs">Paste Set-Cookie Header</label>
                <FileTextArea>
                  <textarea
                    value={rawCookie}
                    onChange={e => setRawCookie(e.target.value)}
                    rows={3}
                    placeholder="Set-Cookie: session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax"
                    className="bg-white text-gray-900 p-3 border border-gray-200 focus:border-gray-400 focus:outline-none font-mono text-sm resize-none"
                  />
                </FileTextArea>
              </div>

              {parsed && (
                <>
                  <div className="w-full h-px bg-gray-200" />
                  <pre className="bg-gray-50 text-gray-900 p-3 border border-gray-200 font-mono text-xs whitespace-pre-wrap">
                    {parsed.formatted}
                  </pre>
                </>
              )}

              {rawCookie.trim() && !parsed && (
                <p className="text-red-400 text-xs">Could not parse cookie string.</p>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
