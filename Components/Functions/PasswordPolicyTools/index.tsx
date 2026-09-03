'use client';

import React, { useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { DEFAULT_RULES, checkPolicy } from './logic';

const PRESETS = [
  { label: 'Weak', value: 'password' },
  { label: 'Common pattern', value: 'Passw0rd123' },
  { label: 'Strong', value: 'Tr0ub4dor&3-Xk!q' },
];

/** Strength bands mirror the score thresholds in checkPolicy. */
function strengthTone(score: number): BadgeTone {
  if (score >= 70) return 'pass';
  if (score >= 50) return 'warn';
  return 'fail';
}

export const PasswordPolicy = () => {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(true);

  const result = useMemo(() => (password ? checkPolicy(password) : null), [password]);

  /** Evaluated in declaration order so the checklist reads consistently. */
  const rules = useMemo(
    () => DEFAULT_RULES.map(rule => ({ ...rule, passes: password ? rule.check(password) : false })),
    [password]
  );

  const composition = useMemo(() => {
    if (!password) return null;
    return {
      length: password.length,
      upper: (password.match(/[A-Z]/g) ?? []).length,
      lower: (password.match(/[a-z]/g) ?? []).length,
      digits: (password.match(/[0-9]/g) ?? []).length,
      special: (password.match(/[^a-zA-Z0-9]/g) ?? []).length,
      unique: new Set(password).size,
    };
  }, [password]);

  return (
    <Panel
      title="Password Policy Checker"
      description="Check a [1 password 2] against common security policy rules — length, character classes, repeated characters and sequential digits. Everything runs in your browser; nothing is sent anywhere."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Password
            </label>
            <div className="flex gap-3">
              <input
                className={inputClass}
                type={visible ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type or paste a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                onClick={() => setVisible(v => !v)}
                className="px-3 py-2 text-xs font-bold border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer flex-shrink-0"
              >
                {visible ? 'Hide' : 'Show'}
              </button>
            </div>
            <PresetRow presets={PRESETS} onPick={setPassword} label="Examples" />
          </div>

          {result && composition && (
            <>
              {/* Strength */}
              <div
                className={`border px-4 py-4 ${
                  result.score >= 70
                    ? 'bg-emerald-50 border-emerald-200'
                    : result.score >= 50
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Strength
                  </span>
                  <StatusBadge tone={strengthTone(result.score)}>{result.strength}</StatusBadge>
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                  {result.score}%
                </div>
                <Meter ratio={result.score / 100} tone={strengthTone(result.score)} />
                <div className="text-xs text-gray-600 mt-2">
                  {result.passed.length} of {DEFAULT_RULES.length} rules passed
                </div>
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={`${result.failed.length} rule${result.failed.length === 1 ? '' : 's'} still failing`}
                >
                  Policy rules
                </SectionTitle>
                <div className="border border-gray-200 divide-y divide-gray-200">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-3 px-3 py-2 ${rule.passes ? '' : 'bg-rose-50'}`}
                    >
                      <span
                        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border font-bold text-xs ${
                          rule.passes
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                            : 'bg-white border-rose-300 text-rose-600'
                        }`}
                        aria-hidden
                      >
                        {rule.passes ? '✓' : '✗'}
                      </span>
                      <span
                        className={`text-sm flex-1 min-w-0 ${
                          rule.passes ? 'text-gray-700' : 'text-gray-900 font-medium'
                        }`}
                      >
                        {rule.label}
                      </span>
                      <span className="sr-only">{rule.passes ? 'passes' : 'fails'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Composition */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="what the password is actually made of">Composition</SectionTitle>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                  <StatTile label="Length" value={composition.length} />
                  <StatTile
                    label="Unique"
                    value={composition.unique}
                    hint={`${Math.round((composition.unique / composition.length) * 100)}% distinct`}
                  />
                  <StatTile label="Uppercase" value={composition.upper} />
                  <StatTile label="Lowercase" value={composition.lower} />
                  <StatTile label="Digits" value={composition.digits} />
                  <StatTile label="Special" value={composition.special} />
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
