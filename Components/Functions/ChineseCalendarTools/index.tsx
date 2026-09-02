'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  BRANCH_TABLE,
  MAX_YEAR,
  MIN_YEAR,
  STEM_TABLE,
  formatLongDate,
  getBranchIndex,
  getCNYDate,
  getChineseYearForDate,
  getChineseYearReport,
  getElement,
  getLunarYearLength,
  getStemIndex,
  getZodiacAnimal,
  isLeapLunarYear,
  parseYearInput,
  weekdayOf,
  type ChineseYearReport,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: '2024 Dragon', value: '2024' },
  { label: '2025 Snake', value: '2025' },
  { label: '1988 Dragon', value: '1988' },
  { label: '1949', value: '1949' },
  { label: '1900 start', value: '1900' },
];

/**
 * Each of the five elements gets a surface. These carry meaning here — the same
 * element is tinted the same way in the hero, the stem row and the tables — so
 * they are a lookup rather than a per-component choice.
 */
const ELEMENT_STYLE: Record<
  string,
  { chip: string; surface: string; solid: string; text: string }
> = {
  Wood: { chip: 'bg-emerald-50 border-emerald-300 text-emerald-800', surface: 'bg-emerald-50 border-emerald-200', solid: 'bg-emerald-400', text: 'text-emerald-700' },
  Fire: { chip: 'bg-rose-50 border-rose-300 text-rose-800', surface: 'bg-rose-50 border-rose-200', solid: 'bg-rose-400', text: 'text-rose-700' },
  Earth: { chip: 'bg-amber-50 border-amber-300 text-amber-900', surface: 'bg-amber-50 border-amber-200', solid: 'bg-amber-400', text: 'text-amber-800' },
  Metal: { chip: 'bg-slate-100 border-slate-300 text-slate-700', surface: 'bg-slate-50 border-slate-200', solid: 'bg-slate-400', text: 'text-slate-600' },
  Water: { chip: 'bg-sky-50 border-sky-300 text-sky-800', surface: 'bg-sky-50 border-sky-200', solid: 'bg-sky-400', text: 'text-sky-700' },
};

const elementStyle = (el: string) => ELEMENT_STYLE[el] ?? ELEMENT_STYLE.Metal;

/**
 * Nearest year to `from` whose position in a `len`-long cycle is `target`.
 * Used by the clickable stem / branch / animal tiles: picking Tiger from a Rat
 * year should land on the Tiger two years ahead, not the one ten years back.
 */
function nearestYearWith(from: number, len: number, current: number, target: number): number {
  let delta = ((target - current) % len + len) % len;
  if (delta > len / 2) delta -= len;
  const candidate = from + delta;
  if (candidate < MIN_YEAR) return candidate + len;
  if (candidate > MAX_YEAR) return candidate - len;
  return candidate;
}

/** ISO `YYYY-MM-DD` for today, in local time. */
function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ChineseCalendar() {
  const [input, setInput] = useState('2024');
  const [dateInput, setDateInput] = useState('');
  /**
   * Resolved after mount only. Rendering "today" during SSR would bake the build
   * date into the HTML and mismatch on hydration.
   */
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(todayISO());
    const from = new URLSearchParams(window.location.search).get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const parsed = useMemo(() => {
    try {
      return { year: parseYearInput(input), error: null as string | null };
    } catch (e) {
      return { year: null, error: (e as Error).message };
    }
  }, [input]);

  const report: ChineseYearReport | null = useMemo(
    () => (parsed.year === null ? null : getChineseYearReport(parsed.year)),
    [parsed.year]
  );

  // Where today falls inside the displayed lunar year, for the span bar.
  const todayOffset = useMemo(() => {
    if (!report || !today) return null;
    const start = Date.parse(report.chineseNewYear);
    const end = Date.parse(report.nextNewYear);
    const now = Date.parse(today);
    if (now < start || now >= end) return null;
    return (now - start) / (end - start);
  }, [report, today]);

  const dateLookup = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return null;
    const y = Number(dateInput.slice(0, 4));
    if (y < MIN_YEAR || y > MAX_YEAR + 1) return null;
    const chineseYear = getChineseYearForDate(dateInput);
    if (chineseYear < MIN_YEAR || chineseYear > MAX_YEAR) return null;
    return {
      chineseYear,
      animal: getZodiacAnimal(chineseYear),
      element: getElement(chineseYear),
      // True when the date sits in Jan/early Feb *before* that year's new year —
      // the case a naive "take the calendar year" lookup gets wrong.
      shiftedBack: chineseYear !== y,
    };
  }, [dateInput]);

  const setYear = (y: number) => setInput(String(y));

  const nearbyYears = useMemo(() => {
    if (!report) return [];
    const out: number[] = [];
    for (let y = report.gregorianYear - 4; y <= report.gregorianYear + 4; y++) {
      if (y >= MIN_YEAR && y <= MAX_YEAR) out.push(y);
    }
    return out;
  }, [report]);

  const el = report ? elementStyle(report.element) : elementStyle('Metal');

  return (
    <Panel
      title="Chinese New Year Calculator"
      description="Enter a Gregorian year such as [1 2024 2] to get its Chinese New Year date, zodiac animal and element. A Chinese year is named by a heavenly stem paired with an earthly branch — the two cycles below mesh like gears and only repeat every 60 years."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <SectionTitle note={`${MIN_YEAR}–${MAX_YEAR}`}>Gregorian year</SectionTitle>
            <div className="flex items-stretch gap-2">
              <button
                onClick={() => parsed.year !== null && setYear(Math.max(MIN_YEAR, parsed.year - 1))}
                disabled={parsed.year === null || parsed.year <= MIN_YEAR}
                aria-label="Previous year"
                className="w-11 flex-shrink-0 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed font-mono"
              >
                −
              </button>
              <input
                className={`${inputClass} text-center text-lg font-bold`}
                inputMode="numeric"
                spellCheck={false}
                placeholder="2024"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                onClick={() => parsed.year !== null && setYear(Math.min(MAX_YEAR, parsed.year + 1))}
                disabled={parsed.year === null || parsed.year >= MAX_YEAR}
                aria-label="Next year"
                className="w-11 flex-shrink-0 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed font-mono"
              >
                +
              </button>
            </div>
            <PresetRow presets={PRESETS} onPick={setInput} />
            {parsed.error && <ErrorNote>{parsed.error}</ErrorNote>}
          </div>

          {report && (
            <>
              {/* Hero — the animal character carries the answer */}
              <div className={`border px-4 py-5 sm:px-6 ${el.surface}`}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center border-2 bg-white ${el.chip}`}
                    title={`${report.zodiacAnimal} — ${report.animalHanzi}`}
                  >
                    <span className="text-5xl sm:text-6xl leading-none">{report.animalHanzi}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Year of the
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900">
                      {report.element} {report.zodiacAnimal}
                    </div>
                    <div className="font-mono text-sm text-gray-600 mt-1">
                      {report.lunarYearName} · <span className="text-base">{report.hanziPair}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <StatusBadge tone="neutral">{report.polarity}</StatusBadge>
                      <StatusBadge tone="info">#{report.cyclePosition} of 60</StatusBadge>
                      {report.isLeapYear && <StatusBadge tone="warn">leap month</StatusBadge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Span of the lunar year */}
              <div className="flex flex-col gap-2">
                <SectionTitle note={`${report.lunarYearLength} days`}>Lunar year span</SectionTitle>
                <div className="border border-gray-200 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
                    <span className="font-mono text-sm text-gray-900">
                      {formatLongDate(report.chineseNewYear)}
                    </span>
                    <span className="text-[11px] text-gray-400">to</span>
                    <span className="font-mono text-sm text-gray-900">
                      {formatLongDate(report.yearEnds)}
                    </span>
                  </div>
                  {/* Track, with today marked when it falls inside this year */}
                  <div className="relative h-2 bg-gray-100 border border-gray-200">
                    <div className={`absolute inset-y-0 left-0 right-0 ${el.solid} opacity-40`} />
                    {todayOffset !== null && (
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-gray-900"
                        style={{ left: `${todayOffset * 100}%` }}
                        title={`Today — ${today}`}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-gray-400">
                    <span>
                      New year falls on a {report.newYearWeekday}
                    </span>
                    {todayOffset !== null ? (
                      <span className="text-gray-600">
                        The marked line is today &mdash; this year is in progress
                      </span>
                    ) : (
                      <span>
                        {report.isLeapYear
                          ? 'Leap year — 13 lunar months'
                          : 'Common year — 12 lunar months'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Centrepiece: the two meshing cycles */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="click any cell to jump to that year">
                  Sexagenary cycle
                </SectionTitle>
                <p className="text-[11px] text-gray-500 -mt-1 max-w-2xl">
                  Ten heavenly stems turn against twelve earthly branches. Each year advances both
                  by one, so a given pair only comes round again after{' '}
                  <span className="font-mono">lcm(10, 12) = 60</span> years. {report.gregorianYear}{' '}
                  sits at stem {report.stemIndex + 1} and branch {report.branchIndex + 1}.
                </p>

                {/* 10 heavenly stems */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Heavenly stems · 天干 · 10
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                    {STEM_TABLE.map(s => {
                      const active = s.index === report.stemIndex;
                      const style = elementStyle(s.element);
                      const target = nearestYearWith(
                        report.gregorianYear,
                        10,
                        report.stemIndex,
                        s.index
                      );
                      return (
                        <button
                          key={s.name}
                          onClick={() => setYear(target)}
                          title={`${s.name} ${s.hanzi} — ${s.polarity} ${s.element} · go to ${target}`}
                          className={`flex flex-col items-center justify-center py-2 border transition-colors duration-150 cursor-pointer ${
                            active
                              ? `${style.chip} border-2 ring-1 ring-gray-900`
                              : `${style.chip} opacity-45 hover:opacity-100`
                          }`}
                        >
                          <span className="text-xl leading-none">{s.hanzi}</span>
                          <span className="font-mono text-[10px] mt-1 leading-none">{s.name}</span>
                          <span className="text-[9px] mt-1 leading-none opacity-70">
                            {s.element}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 12 earthly branches */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Earthly branches · 地支 · 12
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-1.5">
                    {BRANCH_TABLE.map(b => {
                      const active = b.index === report.branchIndex;
                      const target = nearestYearWith(
                        report.gregorianYear,
                        12,
                        report.branchIndex,
                        b.index
                      );
                      return (
                        <button
                          key={b.name}
                          onClick={() => setYear(target)}
                          title={`${b.name} ${b.hanzi} — ${b.animal} · go to ${target}`}
                          className={`flex flex-col items-center justify-center py-2 border transition-colors duration-150 cursor-pointer ${
                            active
                              ? 'bg-indigo-50 border-indigo-400 border-2 text-indigo-900 ring-1 ring-gray-900'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                          }`}
                        >
                          <span className="text-xl leading-none">{b.hanzi}</span>
                          <span className="text-base leading-none mt-1">{b.animalHanzi}</span>
                          <span className="font-mono text-[9px] mt-1 leading-none">{b.animal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Position within the 60 */}
                <div className="mt-1">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Position in the 60-year cycle
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {report.cyclePosition}/60
                    </span>
                  </div>
                  <Meter ratio={report.cyclePosition / 60} tone="info" />
                  <p className="text-[11px] text-gray-400 mt-1">
                    The same {report.hanziPair} pair returns in{' '}
                    {report.sameCycleYears.filter(y => y !== report.gregorianYear).join(' and ') ||
                      'no other year in range'}
                    .
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <StatTile
                  label="New year"
                  value={report.chineseNewYear.slice(5)}
                  hint={report.newYearWeekday}
                />
                <StatTile label="Animal" value={report.zodiacAnimal} hint={report.animalHanzi} />
                <StatTile label="Element" value={report.element} hint={report.polarity} />
                <StatTile
                  label="Stem · branch"
                  value={report.lunarYearName}
                  hint={report.hanziPair}
                />
                <StatTile
                  label="Year length"
                  value={`${report.lunarYearLength} d`}
                  hint={report.isLeapYear ? '13 months' : '12 months'}
                />
                <StatTile
                  label="Next new year"
                  value={report.nextNewYear.slice(5)}
                  hint={`${report.nextElement} ${report.nextAnimal}`}
                />
              </div>

              {/* Zodiac ring */}
              <div className="flex flex-col gap-2">
                <SectionTitle note="click to jump to the nearest such year">
                  Twelve-year zodiac
                </SectionTitle>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 sm:gap-1.5">
                  {BRANCH_TABLE.map(b => {
                    const active = b.index === report.branchIndex;
                    const target = nearestYearWith(
                      report.gregorianYear,
                      12,
                      report.branchIndex,
                      b.index
                    );
                    return (
                      <button
                        key={b.animal}
                        onClick={() => setYear(target)}
                        title={`${b.animal} — nearest is ${target}`}
                        className={`flex flex-col items-center justify-center py-2.5 border transition-colors duration-150 cursor-pointer ${
                          active
                            ? `${el.chip} border-2 ring-1 ring-gray-900`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-2xl leading-none">{b.animalHanzi}</span>
                        <span className="font-mono text-[10px] mt-1.5 leading-none">
                          {b.animal}
                        </span>
                        <span className="font-mono text-[9px] mt-1 leading-none opacity-60">
                          {target}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400">
                  Other {report.zodiacAnimal} years in range:{' '}
                  <span className="font-mono text-gray-600">
                    {report.sameAnimalYears.filter(y => y !== report.gregorianYear).join(', ')}
                  </span>
                </p>
              </div>

              {/* Date lookup — the boundary the year field cannot express */}
              <div className="flex flex-col gap-2">
                <SectionTitle note="the animal turns over at new year, not on 1 January">
                  Look up a date
                </SectionTitle>
                <div className="border border-gray-200 px-4 py-3 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="date"
                      className={`${inputClass} max-w-[12rem]`}
                      min={`${MIN_YEAR}-01-01`}
                      max={`${MAX_YEAR + 1}-12-31`}
                      value={dateInput}
                      onChange={e => setDateInput(e.target.value)}
                    />
                    {today && (
                      <button
                        onClick={() => setDateInput(today)}
                        className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                      >
                        Today
                      </button>
                    )}
                  </div>
                  {dateLookup ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-700">
                        {formatLongDate(dateInput)} falls in the year of the{' '}
                        <button
                          onClick={() => setYear(dateLookup.chineseYear)}
                          className="font-mono font-bold text-gray-900 underline underline-offset-2 hover:no-underline cursor-pointer"
                        >
                          {dateLookup.element} {dateLookup.animal}
                        </button>{' '}
                        — the Chinese year that began on {getCNYDate(dateLookup.chineseYear)}.
                      </p>
                      {dateLookup.shiftedBack && (
                        <p className="text-[11px] text-amber-700">
                          Note: this date is before {dateInput.slice(0, 4)}&rsquo;s new year, so it
                          belongs to the {dateLookup.chineseYear} animal — not{' '}
                          {getZodiacAnimal(Number(dateInput.slice(0, 4)))}.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      Pick a date between {MIN_YEAR} and {MAX_YEAR} to see which Chinese year covers
                      it.
                    </p>
                  )}
                </div>
              </div>

              {/* Nearby years */}
              <div className="flex flex-col gap-2">
                <SectionTitle note="click a year to select it">Nearby years</SectionTitle>
                <ResultTable
                  headers={['Year', 'New year', 'Day', 'Stem-branch', 'Animal', 'Length']}
                  align={['right', 'left', 'left', 'left', 'left', 'right']}
                  rows={nearbyYears.map(y => {
                    const isCurrent = y === report.gregorianYear;
                    const stem = STEM_TABLE[getStemIndex(y)];
                    const branch = BRANCH_TABLE[getBranchIndex(y)];
                    const len = getLunarYearLength(y);
                    return [
                      <button
                        key="y"
                        onClick={() => setYear(y)}
                        className={`cursor-pointer hover:underline ${isCurrent ? 'font-black text-gray-900' : 'text-gray-600'}`}
                      >
                        {y}
                      </button>,
                      <span key="d" className={isCurrent ? 'font-bold' : ''}>
                        {getCNYDate(y)}
                      </span>,
                      <span key="w" className="text-gray-500">
                        {weekdayOf(getCNYDate(y)).slice(0, 3)}
                      </span>,
                      <span key="sb">
                        {stem.name}-{branch.name}{' '}
                        <span className="text-gray-400">
                          {stem.hanzi}
                          {branch.hanzi}
                        </span>
                      </span>,
                      <span key="a" className={elementStyle(getElement(y)).text}>
                        {getElement(y)} {branch.animal}
                      </span>,
                      <span key="l" className={isLeapLunarYear(y) ? 'text-amber-700' : ''}>
                        {len}
                      </span>,
                    ];
                  })}
                />
              </div>

            </>
          )}
        </div>
      }
    />
  );
}
