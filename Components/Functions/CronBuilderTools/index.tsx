'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  cronToString,
  parseCron,
  validateCron,
  CRON_PRESETS,
  type CronParts,
} from './logic';

export const CronBuilder = () => {
  const [parts, setParts] = useState<CronParts>({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  });
  const [humanReadable, setHumanReadable] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const cronExpr = cronToString(parts);

  useEffect(() => {
    const errs = validateCron(parts);
    setErrors(errs);
    if (errs.length > 0) {
      setHumanReadable('');
      return;
    }
    import('cronstrue')
      .then(m => m.default ?? m)
      .then(cronstrue => {
        try {
          const result = (
            cronstrue as { toString: (expr: string, opts?: object) => string }
          ).toString(cronExpr, { throwExceptionOnParseError: true });
          setHumanReadable(result);
        } catch {
          setHumanReadable('Unable to parse expression');
        }
      })
      .catch(() => setHumanReadable(''));
  }, [cronExpr, parts]);

  const setPart = (key: keyof CronParts) => (value: string) => {
    setParts(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (cron: string) => {
    try { setParts(parseCron(cron)); } catch { /* ignore */ }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-2.5 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm text-center';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

  const fields: { label: string; key: keyof CronParts; placeholder: string }[] = [
    { label: 'Minute', key: 'minute', placeholder: '0-59' },
    { label: 'Hour', key: 'hour', placeholder: '0-23' },
    { label: 'Day of Month', key: 'dayOfMonth', placeholder: '1-31' },
    { label: 'Month', key: 'month', placeholder: '1-12' },
    { label: 'Day of Week', key: 'dayOfWeek', placeholder: '0-7' },
  ];

  return (
    <Panel
      title="Cron Builder"
      description="Build and validate [1 cron expressions 2] visually. Use [1 * 2] for any, [1 */5 2] for every 5, [1 1-5 2] for ranges, or [1 1,15 2] for lists."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Preset selector */}
          <div>
            <label className={`${labelClass} block mb-1`}>Presets</label>
            <select
              className="bg-white text-gray-900 text-sm border border-gray-300 px-3 py-2 focus:outline-none focus:border-gray-900 w-full cursor-pointer"
              defaultValue=""
              onChange={e => { if (e.target.value) applyPreset(e.target.value); }}
            >
              <option value="" disabled>Select a preset…</option>
              {CRON_PRESETS.map(p => (
                <option key={p.cron} value={p.cron}>{p.label} — {p.cron}</option>
              ))}
            </select>
          </div>

          {/* Field inputs */}
          <div className="grid grid-cols-5 gap-2">
            {fields.map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className={`${labelClass} text-center block`}>{f.label}</label>
                <input
                  className={inputClass}
                  value={parts[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => setPart(f.key)(e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3">
              {errors.map((err, i) => (
                <p key={i} className="text-red-700 text-sm">{err}</p>
              ))}
            </div>
          )}

          {/* Cron expression display */}
          <div className="border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className={labelClass}>Cron Expression</p>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="text-gray-900 text-2xl font-black font-mono block text-center py-2">{cronExpr}</code>
          </div>

          {/* Human-readable output */}
          {humanReadable && errors.length === 0 && (
            <div className="border border-gray-200 p-4 bg-gray-50 text-center">
              <p className={`${labelClass} mb-1`}>Human Readable</p>
              <p className="text-gray-900 text-base font-bold">{humanReadable}</p>
            </div>
          )}
        </div>
      }
    />
  );
};
