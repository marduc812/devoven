'use client';

import React, { useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  HeroResult,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeSecurityHeaders,
  type SecurityHeaderResult,
  type WarningLevel,
} from './logic';

const SAMPLE_WEAK = `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Server: nginx/1.18.0 (Ubuntu)
X-Powered-By: PHP/7.4.3
Set-Cookie: session=abc123; Path=/
X-Frame-Options: ALLOW-FROM https://example.com
Strict-Transport-Security: max-age=3600`;

const SAMPLE_STRONG = `HTTP/2 200
content-type: text/html; charset=utf-8
content-security-policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
cross-origin-embedder-policy: require-corp
cross-origin-opener-policy: same-origin
set-cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax`;

const SAMPLE_MIXED = `HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
Referrer-Policy: unsafe-url
X-XSS-Protection: 1; mode=block
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true`;

const PRESETS = [
  { label: 'well configured', value: SAMPLE_STRONG },
  { label: 'weak values', value: SAMPLE_MIXED },
  { label: 'barely any', value: SAMPLE_WEAK },
];

const SEVERITY_TONE: Record<SecurityHeaderResult['severity'], BadgeTone> = {
  critical: 'fail',
  high: 'fail',
  medium: 'warn',
  low: 'info',
  info: 'neutral',
};

const WARNING_TONE: Record<WarningLevel, BadgeTone> = {
  high: 'fail',
  medium: 'warn',
  low: 'info',
};

const GRADE_TONE: Record<string, BadgeTone> = {
  A: 'pass',
  B: 'pass',
  C: 'warn',
  D: 'warn',
  E: 'fail',
  F: 'fail',
};

/** Title-case a lowercase header name back into its canonical spelling. */
const headerTitle = (name: string) =>
  name
    .split('-')
    .map(part => (/^(xss|csp)$/i.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('-');

export const HttpSecurityCheck = () => {
  const [raw, setRaw] = useState('');

  const audit = useMemo(() => (raw.trim() ? analyzeSecurityHeaders(raw) : null), [raw]);
  const scoreTone: BadgeTone = audit ? GRADE_TONE[audit.grade] : 'neutral';

  return (
    <Panel
      title="HTTP Security Headers Checker"
      description="Paste raw [1 HTTP response headers 2] — from [1 curl -I 2] or the browser network tab — to see which security headers are missing and, just as importantly, which ones are present but set to a value that does nothing. Covers CSP, HSTS, X-Frame-Options, cookie flags, CORS and version disclosure."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500" htmlFor="headers-input">
              Response headers
            </label>
            <FileTextArea>
              <textarea
                id="headers-input"
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y transition-colors duration-150 font-mono text-xs"
                rows={10}
                spellCheck={false}
                placeholder={SAMPLE_WEAK}
                value={raw}
                onChange={e => setRaw(e.target.value)}
              />
            </FileTextArea>
            <PresetRow presets={PRESETS} onPick={setRaw} label="Sample" />
          </div>

          {audit && (
            <>
              <HeroResult
                label="Coverage score"
                value={
                  <span className="flex items-baseline gap-3">
                    <span>{audit.parsed.score}</span>
                    <span className="text-base text-gray-500">/ 100</span>
                    <span className="text-xl">grade {audit.grade}</span>
                  </span>
                }
                tone={scoreTone}
                note={
                  <span className="flex flex-col gap-2">
                    <Meter ratio={audit.parsed.score / 100} tone={scoreTone} />
                    <span>
                      {audit.present.length} of {audit.parsed.securityResults.length} checked headers present ·{' '}
                      {audit.totalHeaders} header{audit.totalHeaders === 1 ? '' : 's'} pasted
                    </span>
                    <span className="text-gray-400">
                      The score counts presence only. A present header with a weak value still scores — read the
                      warnings below.
                    </span>
                  </span>
                }
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile
                  label="Critical missing"
                  value={audit.missingBySeverity.critical}
                  hint="CSP and HSTS"
                />
                <StatTile label="High missing" value={audit.missingBySeverity.high} />
                <StatTile label="Weak values" value={audit.warnings.length} hint="present but not doing the job" />
                <StatTile
                  label="Version disclosure"
                  value={audit.disclosures.length}
                  hint={audit.disclosures.length > 0 ? 'names your software' : 'none'}
                />
              </div>

              {audit.warnings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="headers that are set but not protecting you">Weak values</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {audit.warnings.map((w, i) => (
                      <div key={i} className="border border-gray-200 bg-gray-50 px-3 py-2 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-900">{w.header}</span>
                          <StatusBadge tone={WARNING_TONE[w.level]}>{w.level}</StatusBadge>
                        </div>
                        <p className="text-xs text-gray-600 leading-snug">{w.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audit.missing.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={`${audit.missing.length} of ${audit.parsed.securityResults.length}`}>
                    Missing headers
                  </SectionTitle>
                  <div className="flex flex-col gap-2">
                    {audit.missing.map(r => (
                      <div key={r.header} className="border border-gray-200 px-3 py-2 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-900">
                              {headerTitle(r.header)}
                            </span>
                            <StatusBadge tone={SEVERITY_TONE[r.severity]}>{r.severity}</StatusBadge>
                          </span>
                          {r.recommendation && (
                            <CopyButton
                              text={r.recommendation.replace(/^Add:\s*/, '')}
                              label={r.header}
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">{r.description}</p>
                        {r.recommendation && (
                          <pre className="font-mono text-[11px] text-gray-900 bg-gray-50 border border-gray-200 px-2 py-1.5 overflow-x-auto whitespace-pre-wrap">
                            {r.recommendation.replace(/^Add:\s*/, '')}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audit.present.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={`${audit.present.length} found`}>Present headers</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {audit.present.map(r => {
                      const flagged = audit.warnings.some(
                        w => w.header.toLowerCase() === r.header.toLowerCase()
                      );
                      return (
                        <div
                          key={r.header}
                          className={`border px-3 py-2 flex flex-col gap-1 ${
                            flagged ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-900">
                              {headerTitle(r.header)}
                            </span>
                            <StatusBadge tone={flagged ? 'warn' : 'pass'}>
                              {flagged ? 'set, but weak' : 'ok'}
                            </StatusBadge>
                          </div>
                          <code className="font-mono text-[11px] text-gray-700 break-all">{r.value}</code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {audit.disclosures.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="tells an attacker what to look up">Version disclosure</SectionTitle>
                  <ResultTable
                    headers={['Header', 'Value']}
                    rows={audit.disclosures.map(d => [
                      <span key="name" className="font-bold text-gray-900">{d.name}</span>,
                      <span key="value" className="text-rose-700 break-all">{d.value}</span>,
                    ])}
                  />
                  <p className="text-[11px] text-gray-400">
                    None of these is exploitable on its own, but together they narrow an attacker&rsquo;s search
                    to the exact CVEs that apply. Strip or blank them at the proxy.
                  </p>
                </div>
              )}

              {audit.otherHeaders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="not part of the security check">Other headers</SectionTitle>
                  <ResultTable
                    headers={['Header', 'Value']}
                    rows={audit.otherHeaders.map(h => [
                      <span key="name" className="text-gray-700">{h.name}</span>,
                      <span key="value" className="text-gray-500 break-all">{h.value}</span>,
                    ])}
                  />
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
