'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  buildContentType,
  parseContentTypeHeader,
  searchContentTypes,
  type ContentTypeResult,
  type ParsedContentType,
  type ContentTypeEntry,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

type Mode = 'build' | 'parse' | 'browse';

export const ContentTypeBuilder = () => {
  const [mode, setMode] = useState<Mode>('build');
  const [buildInput, setBuildInput] = useState('');
  const [buildResult, setBuildResult] = useState<ContentTypeResult | null>(null);
  const [parseInput, setParseInput] = useState('');
  const [parseResult, setParseResult] = useState<ParsedContentType | null>(null);
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseResults, setBrowseResults] = useState<ContentTypeEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setBuildInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: buildInput })

  useEffect(() => {
    if (!buildInput.trim()) { setBuildResult(null); return; }
    setBuildResult(buildContentType(buildInput));
  }, [buildInput]);

  useEffect(() => {
    if (!parseInput.trim()) { setParseResult(null); return; }
    setParseResult(parseContentTypeHeader(parseInput));
  }, [parseInput]);

  useEffect(() => {
    setBrowseResults(searchContentTypes(browseQuery));
  }, [browseQuery]);

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';

  const TAB_ACTIVE = 'px-3 py-1.5 text-xs font-bold uppercase tracking-wider border bg-gray-900 text-white border-gray-900 cursor-pointer';
  const TAB_INACTIVE = 'px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer';

  return (
    <Panel
      title="Content-Type Builder"
      description="Build a [1 Content-Type 2] header from a file extension or type name, parse an existing header to extract its parts, or browse the 100+ type reference."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            <button className={mode === 'build' ? TAB_ACTIVE : TAB_INACTIVE} onClick={() => setMode('build')}>Build</button>
            <button className={mode === 'parse' ? TAB_ACTIVE : TAB_INACTIVE} onClick={() => setMode('parse')}>Parse</button>
            <button className={mode === 'browse' ? TAB_ACTIVE : TAB_INACTIVE} onClick={() => setMode('browse')}>Browse</button>
          </div>

          {mode === 'build' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Extension or Type Name</label>
                <input
                  className={inputClass}
                  placeholder="e.g. json, html, png, multipart, form, webp..."
                  value={buildInput}
                  onChange={e => setBuildInput(e.target.value)}
                />
              </div>
              {buildInput.trim() && !buildResult && (
                <p className="text-red-600 text-sm">Unknown type — try browsing for the correct key.</p>
              )}
              {buildResult && (
                <div className="border border-gray-200 p-4 bg-gray-50 flex flex-col gap-3">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Full Content-Type Header</p>
                    <div className="flex items-start gap-2">
                      <code className="text-gray-900 text-sm font-mono break-all flex-1">{buildResult.fullHeader}</code>
                      <button
                        className="shrink-0 text-xs text-gray-400 hover:text-gray-900 border border-gray-200 px-2 py-1 transition-colors"
                        onClick={() => handleCopy(buildResult.fullHeader)}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      ['Media Type', buildResult.mediaType],
                      ['Charset', buildResult.charset || '—'],
                      ['Boundary', buildResult.boundary || '—'],
                      ['Notes', buildResult.notes],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 border-b border-gray-200 pb-1.5">
                        <span className="text-gray-500 text-xs w-24 shrink-0">{k}</span>
                        <span className="text-gray-900 text-xs font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'parse' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Content-Type Header Value</label>
                <input
                  className={inputClass}
                  placeholder="e.g. multipart/form-data; boundary=----WebKitFormBoundary..."
                  value={parseInput}
                  onChange={e => setParseInput(e.target.value)}
                />
              </div>
              {parseInput.trim() && !parseResult && (
                <p className="text-red-600 text-sm">Could not parse — ensure it contains a media type (e.g. application/json).</p>
              )}
              {parseResult && (
                <div className="border border-gray-200 p-4 bg-gray-50 flex flex-col gap-2">
                  {[
                    ['Media Type', parseResult.mediaType],
                    ['Subtype', parseResult.subtype],
                    ['Charset', parseResult.charset || '—'],
                    ['Boundary', parseResult.boundary || '—'],
                    ...Object.entries(parseResult.extra)
                      .filter(([k]) => k !== 'charset' && k !== 'boundary')
                      .map(([k, v]) => [k, v]),
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 border-b border-gray-200 pb-1.5">
                      <span className="text-gray-500 text-xs w-24 shrink-0">{k}</span>
                      <span className="text-gray-900 text-xs font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'browse' && (
            <div className="flex flex-col gap-3">
              <input
                className={inputClass}
                placeholder="Filter by extension, media type, or description..."
                value={browseQuery}
                onChange={e => setBrowseQuery(e.target.value)}
              />
              <p className="text-gray-500 text-xs">{browseResults.length} type{browseResults.length !== 1 ? 's' : ''}</p>
              <div className="flex flex-col gap-2">
                {browseResults.map(e => (
                  <div key={e.mediaType + e.keys[0]} className="border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {e.keys.slice(0, 4).map(k => (
                        <span key={k} className="inline-flex px-1.5 py-0.5 text-xs font-mono border bg-sky-50 text-sky-700 border-sky-200">
                          {k}
                        </span>
                      ))}
                    </div>
                    <code className="text-gray-900 text-xs font-mono block">
                      {e.mediaType}{e.charset ? '; charset=' + e.charset : ''}
                    </code>
                    <p className="text-gray-500 text-xs">{e.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
