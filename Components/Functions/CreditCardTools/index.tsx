'use client';

import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  HeroResult,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeCard, type CardReport } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

// The standard publisher sandbox numbers — none of these is a real card.
const PRESETS = [
  { label: 'Visa', value: '4532 0151 1283 0366' },
  { label: 'Mastercard', value: '5425 2334 3010 9903' },
  { label: 'AmEx', value: '3782 822463 10005' },
  { label: 'Discover', value: '6011 1111 1111 1117' },
  { label: 'Diners', value: '3056 930902 5904' },
  { label: 'mistyped', value: '4532 0151 1283 0367' },
];

/** The number as digit tiles with the doubled positions marked. Luhn counts
 *  from the right, which is invisible when the digits are just a string. */
const DigitStrip = ({ report }: { report: CardReport }) => (
  <div className="border border-gray-200 overflow-x-auto">
    <div className="flex gap-1 px-3 py-3 min-w-fit">
      {report.steps.map(s => {
        const isCheck = s.fromRight === 1;
        return (
          <div
            key={s.position}
            title={
              isCheck
                ? `Check digit — ${s.digit}`
                : `${s.digit}${s.doubled ? ` doubled → ${s.contribution}` : ' kept as is'}`
            }
            className={`flex flex-col items-center border px-2 py-1 ${
              isCheck
                ? report.luhnValid
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
                : s.doubled
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="font-mono text-base font-bold text-gray-900 leading-tight">{s.digit}</span>
            <span
              className={`font-mono text-[10px] leading-tight ${
                s.doubled ? 'text-indigo-700 font-bold' : 'text-gray-400'
              }`}
            >
              {s.contribution}
            </span>
          </div>
        );
      })}
    </div>
    <div className="flex flex-wrap gap-3 border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-indigo-50 border border-indigo-200 inline-block" /> doubled (every 2nd from
        the right)
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-gray-50 border border-gray-200 inline-block" /> kept as is
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-emerald-50 border border-emerald-200 inline-block" /> check digit
      </span>
    </div>
  </div>
);

export function CreditCardTools() {
  const [fromValue, setFromValue] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: fromValue })

  const { report, error } = useMemo(() => {
    if (!fromValue.trim()) return { report: null, error: '' };
    try {
      return { report: analyzeCard(fromValue), error: '' };
    } catch (e) {
      return { report: null, error: (e as Error).message };
    }
  }, [fromValue]);

  return (
    <Panel
      title="Credit Card Validator"
      description="Check a card number against the [1 Luhn algorithm 2] and see the arithmetic digit by digit. Detects the network from the IIN (Visa, Mastercard, AmEx, Discover, JCB, Diners Club) and checks the length against what that network issues. Digits, spaces or dashes all work."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500" htmlFor="card-input">
              Card number
            </label>
            <input
              id="card-input"
              className={inputClass}
              placeholder="4532 0151 1283 0366"
              inputMode="numeric"
              autoComplete="off"
              value={fromValue}
              onChange={e => setFromValue(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setFromValue} label="Test numbers" />
            <p className="text-[11px] text-gray-400">
              Nothing leaves your browser — the check runs entirely on this page. Luhn only proves the digits
              are internally consistent; it says nothing about whether the card exists or has funds.
            </p>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {report && (
            <>
              <HeroResult
                label={`${report.brandName} — ${report.valid ? 'valid' : 'invalid'}`}
                value={report.formatted}
                tone={report.valid ? 'pass' : 'fail'}
                copyText={report.digits}
                note={
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={report.luhnValid ? 'pass' : 'fail'}>
                      Luhn {report.luhnValid ? 'passes' : 'fails'}
                    </StatusBadge>
                    <StatusBadge tone={report.lengthValid ? 'pass' : 'fail'}>
                      Length {report.lengthValid ? 'ok' : 'wrong'}
                    </StatusBadge>
                    <StatusBadge tone={report.brand ? 'info' : 'warn'}>
                      {report.brand ? report.brand.iin : 'unknown IIN'}
                    </StatusBadge>
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile label="Network" value={report.brandName} hint={report.brand?.iin} />
                <StatTile
                  label="Digits"
                  value={report.digits.length}
                  hint={report.brand ? `${report.brand.lengths.join(' / ')} issued` : 'unknown network'}
                />
                <StatTile
                  label="Check digit"
                  value={report.checkDigit}
                  hint={report.luhnValid ? 'matches' : `should be ${report.expectedCheckDigit}`}
                />
                <StatTile
                  label="CVV length"
                  value={report.brand ? report.brand.cvvLength : '—'}
                  hint={report.brand ? undefined : 'unknown network'}
                />
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle note={`Luhn total ${report.sum} · ${report.sum} mod 10 = ${report.sum % 10}`}>
                  Luhn breakdown
                </SectionTitle>
                <DigitStrip report={report} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle note={`Masked: ${report.masked}`}>Step by step</SectionTitle>
                <button
                  onClick={() => setShowSteps(v => !v)}
                  className="self-start border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  {showSteps ? 'Hide' : 'Show'} the running total
                </button>
                {showSteps && (
                  <ResultTable
                    headers={['#', 'From right', 'Digit', 'Doubled', 'Adds', 'Running total']}
                    align={['right', 'right', 'right', 'left', 'right', 'right']}
                    rows={report.steps.map(s => [
                      s.position,
                      s.fromRight,
                      s.digit,
                      s.doubled ? (
                        <span className="text-indigo-700">
                          {s.digit} × 2 = {s.digit * 2}
                          {s.digit * 2 > 9 ? ` − 9 = ${s.contribution}` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">no</span>
                      ),
                      s.contribution,
                      s.running,
                    ])}
                  />
                )}
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
