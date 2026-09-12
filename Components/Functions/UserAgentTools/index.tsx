'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Field,
  HeroResult,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  UA_PRESETS,
  crawlerName,
  parseUserAgent,
  tokenizeUserAgent,
  userAgentWarnings,
} from './logic';

const deviceHint: Record<string, string> = {
  desktop: 'no mobile or tablet token',
  mobile: 'a phone-sized screen',
  tablet: 'a tablet token',
  bot: 'a crawler, or something claiming to be one',
};

export const UserAgentParser = () => {
  const [fromValue, setFromValue] = useState('');
  const [ownAgent, setOwnAgent] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOwnAgent(window.navigator.userAgent);
    const from = new URLSearchParams(window.location.search).get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useShareLink({ from: fromValue });

  const result = useMemo(() => {
    const trimmed = fromValue.trim();
    if (!trimmed) return null;
    try {
      const parsed = parseUserAgent(trimmed);
      return {
        parsed,
        crawler: crawlerName(trimmed),
        tokens: tokenizeUserAgent(trimmed),
        warnings: userAgentWarnings(trimmed, parsed),
        error: null as string | null,
      };
    } catch (error) {
      return {
        parsed: null,
        crawler: null,
        tokens: [],
        warnings: [],
        error: error instanceof Error ? error.message : 'Could not read this user agent',
      };
    }
  }, [fromValue]);

  const parsed = result?.parsed;
  const crawler = result?.crawler ?? null;
  const version = parsed?.browserVersion || '';
  // "Unknown" is the parser's way of saying no token said, which reads badly in
  // a sentence: "Chrome 120 on Unknown".
  const os = parsed && parsed.os !== 'Unknown'
    ? `${parsed.os}${parsed.osVersion ? ` ${parsed.osVersion}` : ''}`
    : '';
  const known = Boolean(parsed && parsed.browser !== 'Unknown');
  const legacyCount = result?.tokens.filter((t) => t.legacy).length ?? 0;

  let headline = 'An unrecognised agent';
  if (crawler) headline = crawler;
  else if (known && parsed) {
    headline = `${parsed.browser}${version ? ` ${version.split('.')[0]}` : ''}${os ? ` on ${os}` : ''}`;
  }

  // The presets, plus whatever the reader is actually browsing with.
  const presets = ownAgent
    ? [{ label: 'This browser', value: ownAgent }, ...UA_PRESETS]
    : UA_PRESETS;

  return (
    <Panel
      title="User-Agent Parser"
      description="Break a [1 User-Agent 2] header into the browser, operating system, device and engine it claims, then read it token by token. Most of the string is not about the browser sending it: [1 Mozilla/5.0 2] dates to 1994, and every Chromium browser still ships a [1 Safari 2] token so old server-side sniffing serves it the right page."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Field
              label="User-Agent"
              value={fromValue}
              onChange={setFromValue}
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 …"
              file
            />
            <PresetRow presets={presets} onPick={setFromValue} />
          </div>

          {result?.error && <ErrorNote>{result.error}</ErrorNote>}

          {parsed && (
            <>
              <HeroResult
                label="Claims to be"
                value={headline}
                note={`${
                  crawler && known ? `sends ${parsed.browser}'s tokens · ` : ''
                }${parsed.engine} engine · ${parsed.device}${
                  legacyCount ? ` · ${legacyCount} of ${result.tokens.length} tokens are compatibility boilerplate` : ''
                }`}
                tone={parsed.device === 'bot' ? 'warn' : known ? 'pass' : 'neutral'}
                copyText={fromValue.trim()}
              />

              {result.warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-3">
                  <StatusBadge tone="info">note</StatusBadge>
                  <span className="text-xs text-gray-500">{warning}</span>
                </div>
              ))}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <StatTile label="Browser" value={parsed.browser} />
                <StatTile label="Version" value={version || '—'} hint={version ? 'as reported' : 'no version token'} />
                <StatTile label="OS" value={parsed.os} hint={parsed.osVersion || undefined} />
                <StatTile label="Device" value={parsed.device} hint={deviceHint[parsed.device]} />
                <StatTile label="Engine" value={parsed.engine} />
              </div>

              <div className="flex flex-col gap-3">
                <SectionTitle note="products, then the parts of each comment">
                  Token by Token
                </SectionTitle>
                <ResultTable
                  headers={['Token', 'Kind', 'What it says']}
                  rows={result.tokens.map((token, i) => [
                    // The notes are sentences. Left to wrap inside a w-full
                    // table on a phone they become one word per line, so the
                    // columns keep a floor and the table scrolls instead.
                    <span
                      key={`t${i}`}
                      className={`whitespace-nowrap ${token.legacy ? 'text-gray-400 line-through' : ''}`}
                    >
                      {token.text}
                    </span>,
                    <span key={`k${i}`} className="text-gray-500">
                      {token.kind}
                    </span>,
                    <span
                      key={`n${i}`}
                      className={`block min-w-[17rem] ${token.note ? 'text-gray-500' : 'text-gray-300'}`}
                    >
                      {token.note || 'Nothing recognised'}
                    </span>,
                  ])}
                />
                {legacyCount > 0 && (
                  <p className="text-[11px] text-gray-400">
                    Struck-through tokens are boilerplate: they are sent whatever the browser is, and
                    tell you nothing about it.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
