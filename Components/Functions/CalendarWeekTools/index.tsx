'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiCalendar } from 'react-icons/fi';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { getCalendarWeek, countBusinessDays } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function datePickerValue(value: string): string {
  try {
    return getCalendarWeek(value).date;
  } catch {
    return '';
  }
}

function DateInputWithPicker({ id, value, onChange, placeholder, pickerLabel }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  pickerLabel: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        className="bg-white text-gray-900 placeholder:text-gray-400 pl-3 pr-12 py-2 w-full min-w-0 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm"
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      <div className="absolute inset-y-px right-px w-10 flex items-center justify-center border-l border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 focus-within:outline focus-within:outline-2 focus-within:outline-gray-900">
        <FiCalendar className="h-4 w-4 pointer-events-none" aria-hidden="true" />
        <input
          type="date"
          aria-label={pickerLabel}
          title={pickerLabel}
          value={datePickerValue(value)}
          onChange={event => onChange(event.target.value)}
          onClick={event => {
            try {
              event.currentTarget.showPicker?.();
            } catch {
              // The native picker indicator still works if showPicker is unavailable.
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
        />
      </div>
    </div>
  );
}

export function CalendarWeekCalculator({ article }: { article?: React.ReactNode } = {}) {
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

  return (
    <Panel
      article={article}
      title="Business days and work weeks calculator"
      description="Count calendar work days between two dates and convert business days to [1 5-day work weeks 2]. Saturdays and Sundays are excluded. Weekday holidays are included. Enter [1 YYYY-MM-DD 2] dates to see the selected date's calendar week, quarter, and day of year."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="calendar-start-date" className={`${labelClass} block mb-1`}>Date</label>
              <DateInputWithPicker
                id="calendar-start-date"
                value={date}
                onChange={setDate}
                placeholder="e.g. 2024-03-15"
                pickerLabel="Choose first date"
              />
            </div>
            <div>
              <label htmlFor="calendar-end-date" className={`${labelClass} block mb-1`}>Second date <span className="normal-case font-normal text-gray-400">optional, for business days</span></label>
              <DateInputWithPicker
                id="calendar-end-date"
                value={secondDate}
                onChange={setSecondDate}
                placeholder="e.g. 2024-12-31"
                pickerLabel="Choose second date"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Business Days</p>
                  <p className="text-2xl font-black text-gray-900">{bizResult.data.businessDays}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Work weeks</p>
                  <p className="text-2xl font-black text-gray-900">{Math.floor(bizResult.data.businessDays / 5)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">and {bizResult.data.businessDays % 5} work days</p>
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
              <p className="text-xs text-gray-500 mt-2">
                Includes {bizResult.data.date1} and excludes {bizResult.data.date2}. Assumes 5 work days per week. Weekday holidays are included.
              </p>
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
