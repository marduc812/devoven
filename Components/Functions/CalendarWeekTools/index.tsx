'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { getCalendarWeek, countBusinessDays } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function CalendarWeekCalculator() {
  const [date, setDate] = useState('');
  const [secondDate, setSecondDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) {
      setDate(from);
    } else {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: date })

  const result = useMemo(() => {
    if (!date.trim()) return null;
    try {
      return { data: getCalendarWeek(date), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Invalid date' };
    }
  }, [date]);

  const bizResult = useMemo(() => {
    if (!date.trim() || !secondDate.trim()) return null;
    try {
      return { data: countBusinessDays(date, secondDate), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Invalid date' };
    }
  }, [date, secondDate]);

  const data = result?.data ?? null;
  const error = result?.error ?? null;

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Calendar Week Calculator"
      description="Find the ISO week number, day of year, quarter, and full week for any date. Supports [1 2024-03-15 2], [1 March 15, 2024 2], or [1 03/15/2024 2]. Optionally calculate business days to a second date."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Date</label>
              <input
                className={inputClass}
                placeholder="e.g. 2024-03-15"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Second Date <span className="normal-case font-normal text-gray-400">(optional, for business days)</span></label>
              <input
                className={inputClass}
                placeholder="e.g. 2024-12-31"
                value={secondDate}
                onChange={e => setSecondDate(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{error}</div>
          )}

          {data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>ISO Week</p>
                  <p className="text-2xl font-black text-gray-900">W{String(data.isoWeek).padStart(2, '0')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{data.isoYear}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Day of Year</p>
                  <p className="text-2xl font-black text-gray-900">{data.dayOfYear}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{data.daysLeftInYear} left</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Quarter</p>
                  <p className="text-2xl font-black text-gray-900">Q{data.quarter}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{data.isLeapYear ? 'Leap year' : 'Regular year'}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Year Progress</p>
                  <p className="text-2xl font-black text-gray-900">{data.yearProgress}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{data.dayOfWeek}</p>
                </div>
              </div>

              {/* Week dates */}
              <div>
                <p className={`${labelClass} mb-2`}>Week Dates (Mon–Sun)</p>
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const d = data.weekDates[i] ?? '';
                    const isSelected = d === data.date;
                    return (
                      <div
                        key={day}
                        className={`p-2 text-center cursor-pointer ${isSelected ? 'bg-gray-900' : 'bg-white hover:bg-gray-50'}`}
                        onClick={() => d && copy(d)}
                        title="Click to copy"
                      >
                        <p className={`text-xs font-bold ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>{day}</p>
                        <p className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-white font-black' : 'text-gray-700'}`}>{d.slice(5)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details table */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['ISO Date', data.date],
                      ['ISO Week', `W${String(data.isoWeek).padStart(2, '0')}-${data.isoYear}`],
                      ['Day of Week', data.dayOfWeek],
                      ['Quarter', `Q${data.quarter}`],
                      ['Day of Year', `${data.dayOfYear} / ${data.isLeapYear ? 366 : 365}`],
                    ].map(([label, value], i) => (
                      <tr
                        key={label}
                        className={`${i > 0 ? 'border-t border-gray-200' : ''} cursor-pointer hover:bg-gray-50`}
                        onClick={() => copy(value)}
                        title="Click to copy"
                      >
                        <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-36">{label}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-sm">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Business days result */}
          {bizResult?.data && (
            <div>
              <p className={`${labelClass} mb-2`}>Business Days</p>
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Business Days</p>
                  <p className="text-2xl font-black text-gray-900">{bizResult.data.businessDays}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Calendar Days</p>
                  <p className="text-2xl font-black text-gray-900">{bizResult.data.calendarDays}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Weekend Days</p>
                  <p className="text-2xl font-black text-gray-900">{bizResult.data.weekendDays}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{bizResult.data.date1} → {bizResult.data.date2}</p>
            </div>
          )}
          {bizResult?.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{bizResult.error}</div>
          )}
        </div>
      }
    />
  );
}
