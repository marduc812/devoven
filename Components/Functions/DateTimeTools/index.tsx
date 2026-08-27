'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  convertDateFormat,
  listTimezones,
  convertTimezone,
  formatNextRunTimes,
  calculateDuration,
  formatDuration,
  parseDate,
  addDays,
  formatShortDate,
  getWeekReport,
  getWeekRuler,
  isoWeekStart,
  toIsoDate,
  type DateOutputFormat,
  type WeekReport,
} from './logic';

// ---------------------------------------------------------------------------
// 1. Date Format Converter
// ---------------------------------------------------------------------------

export function DateFormatConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState<DateOutputFormat>('iso');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setInput(from);
    const fmt = params.get('format') as DateOutputFormat | null;
    if (fmt) setFormat(fmt);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(convertDateFormat(input, format));
    } catch {
      setOutput('Error: could not parse date. Try ISO 8601, MM/DD/YYYY, DD.MM.YYYY, Unix timestamp, or RFC 2822.');
    }
  }, [input, format]);

  const formatOptions: { value: DateOutputFormat; label: string }[] = [
    { value: 'iso', label: 'ISO 8601' },
    { value: 'us', label: 'US (MM/DD/YYYY)' },
    { value: 'eu', label: 'EU (DD.MM.YYYY)' },
    { value: 'unix', label: 'Unix Timestamp' },
    { value: 'rfc2822', label: 'RFC 2822' },
    { value: 'readable', label: 'Human Readable' },
  ];

  const extraElements = (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="text-gray-400 text-sm">Output format:</label>
      <select
        className="bg-white text-gray-200 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-white/25"
        value={format}
        onChange={(e) => setFormat(e.target.value as DateOutputFormat)}
      >
        {formatOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Date Format Converter"
      description="Convert a date between common formats. Accepts ISO 8601, Unix timestamp, US [1 MM/DD/YYYY 2], EU [1 DD.MM.YYYY 2], and RFC 2822 input. Choose your output format below."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Date"
      toTitle="Converted Date"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}

// ---------------------------------------------------------------------------
// 2. Time Zone Converter
// ---------------------------------------------------------------------------

export function CronToHuman() {
  const [expr, setExpr] = useState('');
  const [humanText, setHumanText] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setExpr(from);
  }, []);

  useEffect(() => {
    if (!expr.trim()) {
      setHumanText('');
      setNextRuns([]);
      setError('');
      return;
    }

    const run = async () => {
      try {
        // Lazy-load both libraries
        const [cronstrue, cronParser] = await Promise.all([
          import('cronstrue').then(m => m.default ?? m),
          import('cron-parser'),
        ]);

        const human = (cronstrue as { toString: (expr: string, opts?: object) => string }).toString(expr, { throwExceptionOnParseError: true });
        setHumanText(human);
        setError('');

        // Compute next 5 run times
        const interval = (cronParser as unknown as { parseExpression: (expr: string, opts?: object) => { next: () => { toDate: () => Date } } }).parseExpression(expr, { utc: true });
        const dates: Date[] = [];
        for (let i = 0; i < 5; i++) {
          dates.push(interval.next().toDate());
        }
        setNextRuns(formatNextRunTimes(dates, 5));
      } catch (err: unknown) {
        setHumanText('');
        setNextRuns([]);
        setError(err instanceof Error ? err.message : 'Invalid cron expression');
      }
    };

    run();
  }, [expr]);

  const panelContent = (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-sm">Cron Expression</label>
        <input
          type="text"
          className="bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/25"
          placeholder="e.g. 0 9 * * 1-5"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
        />
        <span className="text-gray-600 text-xs">5-field format: minute hour day month weekday</span>
      </div>

      {error && (
        <div className="text-red-400 text-sm font-mono bg-gray-50 px-3 py-2 border border-red-500/20">{error}</div>
      )}

      {humanText && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-sm">Human Description</label>
          <div className="text-gray-900 text-sm font-mono bg-gray-50 px-3 py-3 border border-gray-200">
            {humanText}
          </div>
        </div>
      )}

      {nextRuns.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-sm">Next 5 Run Times (UTC)</label>
          <ul className="flex flex-col gap-1">
            {nextRuns.map((run, i) => (
              <li key={i} className="text-gray-300 text-sm font-mono bg-gray-50 px-3 py-2 border border-gray-200">
                {i + 1}. {run}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!humanText && !error && (
        <div className="text-gray-600 text-sm">Enter a cron expression above to see its description and next run times.</div>
      )}
    </div>
  );

  return (
    <Panel
      title="Cron to Human Readable"
      description="Paste a cron expression to see its human-readable description and the next 5 scheduled run times. Example: [1 0 9 * * 1-5 2] runs at 9 AM Monday through Friday."
      backColor="cyan"
      extraElements={panelContent}
    />
  );
}

// ---------------------------------------------------------------------------
// 4. Duration Calculator
// ---------------------------------------------------------------------------

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Quarter tint for the year grid, so the 52 cells read as four seasons. */
const QUARTER_TINT = [
  'bg-sky-50 border-sky-200 text-sky-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-900',
  'bg-rose-50 border-rose-200 text-rose-800',
];

export function WeekNumberCalculator() {
  const [input, setInput] = useState('');
  /**
   * Resolved after mount only. Rendering today's date during SSR would bake the
   * build date into the HTML and mismatch on hydration.
   */
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(todayISO());
    const from = new URLSearchParams(window.location.search).get('from');
    setInput(from || todayISO());
  }, []);

  const parsed = useMemo(() => {
    if (!input.trim()) return { report: null as WeekReport | null, error: null as string | null };
    try {
      return { report: getWeekReport(input), error: null };
    } catch {
      return {
        report: null,
        error: 'Could not read that date. Try ISO 8601 (2026-04-08), MM/DD/YYYY, DD.MM.YYYY, or a Unix timestamp.',
      };
    }
  }, [input]);

  const report = parsed.report;

  /** The centrepiece: both weeks laid over one ruler of days. */
  const ruler = useMemo(() => {
    if (!report) return null;
    const geometry = getWeekRuler(report);
    const first = new Date(`${geometry.start}T00:00:00Z`);
    return {
      ...geometry,
      days: Array.from({ length: geometry.span }, (_, i) => addDays(first, i)),
    };
  }, [report]);

  /** Every ISO week of the displayed week-year, as a walkable grid. */
  const yearWeeks = useMemo(() => {
    if (!report) return null;
    return Array.from({ length: report.weeksInIsoYear }, (_, i) => {
      const start = isoWeekStart(report.isoWeekYear, i + 1);
      const thursday = addDays(start, 3);
      return {
        week: i + 1,
        start,
        end: addDays(start, 6),
        quarter: Math.floor(thursday.getUTCMonth() / 3),
      };
    });
  }, [report]);

  const presets = [
    ...(today ? [{ label: 'Today', value: today }] : []),
    { label: '2026-04-08', value: '2026-04-08' },
    { label: '2027-01-01', value: '2027-01-01' },
    { label: '2024-12-30', value: '2024-12-30' },
    { label: '2026-12-31', value: '2026-12-31' },
  ];

  const panelContent = (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Date <span className="font-normal text-gray-400 normal-case">ISO 8601, MM/DD/YYYY, DD.MM.YYYY or a Unix timestamp</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. 2026-04-08"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>
        <PresetRow presets={presets} onPick={setInput} />
      </div>

      {parsed.error && <ErrorNote>{parsed.error}</ErrorNote>}

      {report && ruler && yearWeeks && (
        <>
          {/* Headline: the ISO designation, which is what "week 15" should mean. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-indigo-200 bg-indigo-50 px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-2">
                ISO 8601 week
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900">
                {report.isoLabel}
              </div>
              <div className="font-mono text-xs text-gray-500 mt-2">
                Mon {formatShortDate(new Date(`${report.isoWeekStart}T00:00:00Z`))} – Sun{' '}
                {formatShortDate(new Date(`${report.isoWeekEnd}T00:00:00Z`))} · day {report.isoDayNumber} of 7
              </div>
              <div className="text-[11px] text-indigo-700/80 mt-2">
                Weeks start Monday; week 1 is the one holding the first Thursday.
              </div>
            </div>
            <div className="border border-amber-200 bg-amber-50 px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-2">
                US week
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900">
                {report.usWeekYear}-W{String(report.usWeek).padStart(2, '0')}
              </div>
              <div className="font-mono text-xs text-gray-500 mt-2">
                Sun {formatShortDate(new Date(`${report.usWeekStart}T00:00:00Z`))} – Sat{' '}
                {formatShortDate(new Date(`${report.usWeekEnd}T00:00:00Z`))} · day {report.usDayNumber} of 7
              </div>
              <div className="text-[11px] text-amber-800/80 mt-2">
                Weeks start Sunday; week 1 is the one holding 1 January.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="neutral">{report.longDate}</StatusBadge>
            {report.isWeekend && <StatusBadge tone="warn">Weekend</StatusBadge>}
            {report.isoWeek === report.usWeek ? (
              <StatusBadge tone="pass">Both conventions agree: week {report.isoWeek}</StatusBadge>
            ) : (
              <StatusBadge tone="info">
                Conventions disagree: ISO {report.isoWeek} vs US {report.usWeek}
              </StatusBadge>
            )}
            {report.isoYearDiffers && (
              <StatusBadge tone="info">
                ISO week-year is {report.isoWeekYear}, not {report.calendarYear}
              </StatusBadge>
            )}
          </div>

          {/* The two weeks laid over one ruler. */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="Click a day to move the date">
              Where the two weeks fall
            </SectionTitle>
            <div className="border border-gray-200 overflow-x-auto">
              <div
                className="min-w-[600px] p-3 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${ruler.span}, minmax(0, 1fr))` }}
              >
                <div
                  className="border border-indigo-300 bg-indigo-100 text-indigo-900 text-[10px] font-bold uppercase tracking-widest px-2 py-1 text-center truncate"
                  style={{ gridRow: 1, gridColumn: `${ruler.isoOffset + 1} / span 7` }}
                >
                  ISO week {report.isoWeek} · Mon–Sun
                </div>

                {ruler.days.map((d, i) => {
                  const iso = toIsoDate(d);
                  const inIso = i >= ruler.isoOffset && i < ruler.isoOffset + 7;
                  const inUs = i >= ruler.usOffset && i < ruler.usOffset + 7;
                  const selected = iso === report.date;
                  const tint = selected
                    ? 'bg-gray-900 border-gray-900'
                    : inIso && inUs
                      ? 'bg-white border-gray-300 hover:border-gray-900'
                      : inIso
                        ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-500'
                        : 'bg-amber-50 border-amber-200 hover:border-amber-500';
                  return (
                    <button
                      key={iso}
                      onClick={() => setInput(iso)}
                      title={iso}
                      className={`border px-1 py-2 text-center cursor-pointer transition-colors duration-150 ${tint}`}
                      style={{ gridRow: 2 }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {d.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' })}
                      </div>
                      <div
                        className={`font-mono text-sm font-bold ${selected ? 'text-white' : 'text-gray-900'}`}
                      >
                        {d.getUTCDate()}
                      </div>
                      <div className="text-[9px] font-mono text-gray-400">
                        {d.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' })}
                      </div>
                    </button>
                  );
                })}

                <div
                  className="border border-amber-300 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-widest px-2 py-1 text-center truncate"
                  style={{ gridRow: 3, gridColumn: `${ruler.usOffset + 1} / span 7` }}
                >
                  US week {report.usWeek} · Sun–Sat
                </div>
              </div>
            </div>
          </div>

          {/* Year progress. */}
          <div className="flex flex-col gap-2">
            <SectionTitle note={`${(report.yearProgress * 100).toFixed(1)}% of ${report.calendarYear} elapsed`}>
              Year progress
            </SectionTitle>
            <Meter ratio={report.yearProgress} />
            <div className="flex justify-between font-mono text-[10px] text-gray-400">
              <span>1 Jan</span>
              <span>
                day {report.dayOfYear} / {report.daysInYear}
              </span>
              <span>31 Dec</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile label="Day of week" value={report.dayOfWeek} hint={`ISO day ${report.isoDayNumber}`} />
            <StatTile label="Day of year" value={report.dayOfYear} hint={`of ${report.daysInYear}`} />
            <StatTile label="Days left" value={report.daysUntilYearEnd} hint="to 31 Dec" />
            <StatTile label="Quarter" value={`Q${report.quarter}`} hint={String(report.calendarYear)} />
            <StatTile
              label="Weeks in ISO year"
              value={report.weeksInIsoYear}
              hint={report.weeksInIsoYear === 53 ? 'long year' : 'standard'}
            />
            <StatTile
              label="Leap year"
              value={report.isLeapYear ? 'Yes' : 'No'}
              hint={`${report.daysInYear} days`}
            />
          </div>

          {/* The whole ISO year, walkable. */}
          <div className="flex flex-col gap-2">
            <SectionTitle note={`${report.weeksInIsoYear} weeks · click to jump`}>
              ISO weeks of {report.isoWeekYear}
            </SectionTitle>
            <div className="flex flex-wrap gap-1">
              {yearWeeks.map(w => {
                const current = w.week === report.isoWeek;
                return (
                  <button
                    key={w.week}
                    onClick={() => setInput(toIsoDate(w.start))}
                    title={`W${String(w.week).padStart(2, '0')}: ${toIsoDate(w.start)} → ${toIsoDate(w.end)}`}
                    className={`border font-mono text-[11px] w-9 py-1 text-center cursor-pointer transition-colors duration-150 ${
                      current
                        ? 'bg-gray-900 border-gray-900 text-white font-bold'
                        : `${QUARTER_TINT[w.quarter]} hover:border-gray-900`
                    }`}
                  >
                    {String(w.week).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400">
              Tinted by the quarter holding each week&apos;s Thursday — the day that decides which
              year, and so which quarter, an ISO week belongs to.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ValueCard label="ISO week" value={report.isoLabel} />
            <ValueCard label="ISO week starts" value={report.isoWeekStart} />
            <ValueCard label="ISO week ends" value={report.isoWeekEnd} />
          </div>

          <div className="flex flex-col gap-2">
            <SectionTitle>All values</SectionTitle>
            <ResultTable
              headers={['Field', 'Value']}
              rows={[
                ['Date', report.date],
                ['Day of week', `${report.dayOfWeek} (${report.dayOfWeekShort})`],
                ['ISO 8601 week', report.isoLabel],
                ['ISO week span', `${report.isoWeekStart} → ${report.isoWeekEnd}`],
                ['ISO week-year', String(report.isoWeekYear)],
                ['Weeks in ISO year', String(report.weeksInIsoYear)],
                ['US week number', String(report.usWeek)],
                ['US week span', `${report.usWeekStart} → ${report.usWeekEnd}`],
                ['Weeks in US year', String(report.weeksInUsYear)],
                ['Day of year', `${report.dayOfYear} of ${report.daysInYear}`],
                ['Days until year end', String(report.daysUntilYearEnd)],
                ['Quarter', `Q${report.quarter} ${report.calendarYear}`],
                ['Leap year', report.isLeapYear ? 'Yes' : 'No'],
              ]}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Panel
      title="Week Number Calculator"
      description="Find the week number for any date under both conventions — ISO 8601, where weeks run Monday to Sunday and week 1 holds the first Thursday, and the US rule, where weeks run Sunday to Saturday and week 1 holds 1 January. Example: [1 2026-04-08 2] is ISO 2026-W15."
      backColor="cyan"
      extraElements={panelContent}
    />
  );
}
