'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  HeroResult,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatusBadge,
  ValueCard,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeIsbn, type IsbnReport } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: '0-306-40615-2', value: '0-306-40615-2' },
  { label: '978-0-306-40615-7', value: '978-0-306-40615-7' },
  { label: '0-19-853453-1', value: '0-19-853453-1' },
  { label: '979-8-6024-0157-8', value: '979-8-6024-0157-8' },
  { label: 'bad check digit', value: '978-0-306-40615-8' },
];

/** The number drawn as its parts, so the variable-length group is visible. */
const SegmentStrip = ({ report }: { report: IsbnReport }) => {
  const { prefix, group, body, check } = report.segments;
  const parts: { label: string; value: string; className: string }[] = [];

  if (prefix) {
    parts.push({ label: 'Prefix', value: prefix, className: 'bg-indigo-50 border-indigo-200 text-indigo-700' });
  }
  if (group) {
    parts.push({ label: 'Group', value: group, className: 'bg-sky-50 border-sky-200 text-sky-700' });
  }
  parts.push({
    label: group ? 'Registrant + publication' : 'Number',
    value: body,
    className: 'bg-gray-50 border-gray-200 text-gray-900',
  });
  parts.push({
    label: 'Check',
    value: check,
    className: report.valid
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-rose-50 border-rose-200 text-rose-700',
  });

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {parts.map(p => (
        <div key={p.label} className={`border px-3 py-2 ${p.className}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{p.label}</div>
          <div className="font-mono text-lg font-bold tracking-wider break-all">{p.value}</div>
        </div>
      ))}
    </div>
  );
};

const EmptyForm = ({ label, note }: { label: string; note: string }) => (
  <div className="border border-gray-200 bg-gray-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
    <div className="text-xs text-gray-500">{note}</div>
  </div>
);

export function IsbnValidator() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { report, error } = useMemo(() => {
    if (!input.trim()) return { report: null, error: '' };
    try {
      return { report: analyzeIsbn(input), error: '' };
    } catch (e) {
      return { report: null, error: (e as Error).message };
    }
  }, [input]);

  const kindLabel = report?.kind === 'isbn10' ? 'ISBN-10' : 'ISBN-13';

  return (
    <Panel
      title="ISBN Validator"
      description="Validate an [1 ISBN-10 2] or [1 ISBN-13 2] and see the check digit worked out digit by digit. Hyphens and spaces are ignored, the registration group is split off, and valid numbers convert to the other form."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500" htmlFor="isbn-input">
              ISBN
            </label>
            <input
              id="isbn-input"
              className={inputClass}
              placeholder="978-0-306-40615-7"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {report && (
            <>
              <HeroResult
                label={`${kindLabel} — ${report.valid ? 'valid' : 'invalid'}`}
                value={report.hyphenated}
                tone={report.valid ? 'pass' : 'fail'}
                copyText={report.normalized}
                note={
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={report.valid ? 'pass' : 'fail'}>
                      {report.valid ? 'Check digit matches' : 'Check digit wrong'}
                    </StatusBadge>
                    {report.groupName && <StatusBadge tone="info">{report.groupName}</StatusBadge>}
                  </span>
                }
              />

              {report.issues.length > 0 && (
                <div className="flex flex-col gap-1">
                  {report.issues.map(issue => (
                    <ErrorNote key={issue}>{issue}</ErrorNote>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle
                  note={
                    report.segments.group
                      ? 'Registrant and publication need the full ISBN range tables to split further'
                      : 'Leading digits match no published group range'
                  }
                >
                  Structure
                </SectionTitle>
                <SegmentStrip report={report} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Both forms</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.isbn10 ? (
                    <ValueCard label="ISBN-10" value={report.isbn10} />
                  ) : (
                    <EmptyForm
                      label="ISBN-10"
                      note={
                        !report.valid
                          ? 'Fix the check digit first.'
                          : 'None — the 10-digit space ran out, so 979 numbers have no ISBN-10.'
                      }
                    />
                  )}
                  {report.isbn13 ? (
                    <ValueCard label="ISBN-13" value={report.isbn13} />
                  ) : (
                    <EmptyForm label="ISBN-13" note="Fix the check digit first." />
                  )}
                </div>
              </div>

              {report.corrected && (
                <button
                  onClick={() => setInput(report.corrected as string)}
                  className="self-start border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  Use <span className="font-mono font-bold">{report.corrected}</span> instead
                </button>
              )}

              {report.steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle
                    note={
                      report.kind === 'isbn10'
                        ? 'Weights run 10 down to 1; the total must divide by 11'
                        : 'Weights alternate 1 and 3; the total must divide by 10'
                    }
                  >
                    Check digit calculation
                  </SectionTitle>
                  <ResultTable
                    headers={['#', 'Digit', 'Weight', 'Product']}
                    align={['right', 'right', 'right', 'right']}
                    rows={report.steps.map(s => [
                      s.position,
                      s.position === report.steps.length ? (
                        <span className={report.valid ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {s.digit}
                          {s.digit === 'X' && <span className="text-gray-400"> (10)</span>}
                        </span>
                      ) : (
                        s.digit
                      ),
                      `× ${s.weight}`,
                      s.product,
                    ])}
                  />
                  <div className="border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 space-y-1">
                    <div>
                      Sum = <span className="text-gray-900 font-bold">{report.sum}</span>
                    </div>
                    <div>
                      {report.sum} mod {report.modulus} ={' '}
                      <span className={report.valid ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {report.sum % report.modulus}
                      </span>
                      <span className="text-gray-400">
                        {report.valid ? ' — a remainder of 0 means the number checks out' : ' — a valid number leaves 0'}
                      </span>
                    </div>
                    <div>
                      Expected check digit ={' '}
                      <span className="text-gray-900 font-bold">{report.expectedCheckDigit}</span>
                      {!report.valid && <span className="text-gray-400"> (given: {report.checkDigit})</span>}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
