'use client';

import React, { useState } from 'react';
import { StatusBadge, type BadgeTone } from '@/Components/MainView/MainPanel/ResultUI';
import { toCurl } from './logic';
import type { KeyValue, ParsedRequest, ResolvedText } from './types';

/** Only colour families with `.dark` overrides in globals.css are safe here. */
const methodTone: Record<string, string> = {
  GET: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  POST: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  PUT: 'bg-amber-50 border-amber-200 text-amber-700',
  PATCH: 'bg-violet-50 border-violet-200 text-violet-700',
  DELETE: 'bg-rose-50 border-rose-200 text-rose-700',
  HEAD: 'bg-sky-50 border-sky-200 text-sky-700',
  OPTIONS: 'bg-sky-50 border-sky-200 text-sky-700',
};

const MethodBadge = ({ method }: { method: string }) => (
  <span
    className={`inline-block w-[4.5rem] flex-shrink-0 text-center border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest ${
      methodTone[method] ?? 'bg-gray-50 border-gray-200 text-gray-600'
    }`}
  >
    {method}
  </span>
);

const shown = (value: ResolvedText, reveal: boolean) => (reveal ? value.text : value.masked);

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</span>
    {children}
  </div>
);

const PairList = ({ pairs, reveal }: { pairs: KeyValue[]; reveal: boolean }) => (
  <div className="flex flex-col gap-0.5">
    {pairs.map((pair, index) => (
      <div
        key={`${pair.key}-${index}`}
        className={`font-mono text-xs break-all ${pair.disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}
      >
        <span className="text-gray-500">{pair.key}</span>
        {pair.kind === 'file' ? ' @ ' : ': '}
        {shown(pair.value, reveal) || <span className="text-gray-400">(empty)</span>}
      </div>
    ))}
  </div>
);

/** Names what an environment would have to supply for this request to be runnable. */
const UnresolvedNote = ({ request }: { request: ParsedRequest }) => {
  const notes: { tone: BadgeTone; text: string }[] = [];
  if (request.unresolved.missing.length > 0) {
    notes.push({ tone: 'warn', text: `undefined: ${request.unresolved.missing.join(', ')}` });
  }
  if (request.unresolved.circular.length > 0) {
    notes.push({ tone: 'fail', text: `circular: ${request.unresolved.circular.join(' → ')}` });
  }
  if (request.unresolved.dynamic.length > 0) {
    notes.push({ tone: 'info', text: `generated at send time: ${request.unresolved.dynamic.join(', ')}` });
  }
  if (notes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {notes.map(note => (
        <StatusBadge key={note.text} tone={note.tone}>
          {note.text}
        </StatusBadge>
      ))}
    </div>
  );
};

/**
 * Copies the real credential, not the mask — this is a command meant to run, and
 * a masked paste would only fail confusingly.
 */
const CopyCurlButton = ({ request }: { request: ParsedRequest }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(toCurl(request)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {}
    );
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="px-3 py-1.5 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest"
    >
      {copied ? 'Copied' : 'Copy as cURL'}
    </button>
  );
};

const RequestRow = ({ request, reveal }: { request: ParsedRequest; reveal: boolean }) => {
  const [open, setOpen] = useState(false);

  const activeQuery = request.query.filter(entry => !entry.disabled);
  const body = request.body;

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 cursor-pointer min-w-0"
      >
        <MethodBadge method={request.method} />
        <span className="font-mono text-sm text-gray-900 truncate flex-1 min-w-0">{request.path}</span>
        <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[40%]">{request.name}</span>
        <span className="text-gray-400 text-xs flex-shrink-0">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-3 pb-4 pt-1 flex flex-col gap-3 bg-gray-50 border-t border-gray-100">
          {/* The folder trail lives in the group header above, so it is not repeated here. */}
          <UnresolvedNote request={request} />

          <DetailSection title="URL">
            <div className="font-mono text-xs text-gray-900 break-all">{shown(request.url, reveal)}</div>
            {request.url.text !== request.rawUrl && (
              <div className="font-mono text-[11px] text-gray-400 break-all">{request.rawUrl}</div>
            )}
          </DetailSection>

          {request.auth && (
            <DetailSection title={`Auth — ${request.auth.type}${request.auth.inherited ? ' (inherited)' : ''}`}>
              <div className="font-mono text-xs text-gray-900 break-all">
                {reveal && request.auth.header ? request.auth.header.value.text : request.auth.summary}
              </div>
            </DetailSection>
          )}

          {request.pathVariables.length > 0 && (
            <DetailSection title="Path variables">
              <PairList pairs={request.pathVariables} reveal={reveal} />
            </DetailSection>
          )}

          {activeQuery.length > 0 && (
            <DetailSection title="Query">
              <PairList pairs={request.query} reveal={reveal} />
            </DetailSection>
          )}

          {request.headers.length > 0 && (
            <DetailSection title="Headers">
              <PairList pairs={request.headers} reveal={reveal} />
            </DetailSection>
          )}

          {body && (
            <DetailSection title={`Body — ${body.mode}${body.language ? ` (${body.language})` : ''}`}>
              {body.entries ? (
                <PairList pairs={body.entries} reveal={reveal} />
              ) : (
                <pre className="font-mono text-xs text-gray-900 whitespace-pre-wrap break-all border border-gray-200 bg-white p-2 max-h-64 overflow-y-auto">
                  {(body.text ? shown(body.text, reveal) : '') || '(empty)'}
                </pre>
              )}
            </DetailSection>
          )}

          {request.description && (
            <DetailSection title="Description">
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{request.description}</p>
            </DetailSection>
          )}

          <div className="pt-1">
            <CopyCurlButton request={request} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestRow;
