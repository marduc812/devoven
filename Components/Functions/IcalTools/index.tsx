'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  IcalEvent,
  buildIcal,
  describeIcal,
  fieldsToEvent,
  icalFilename,
  icalToEvent,
  isEmptyEvent,
  parseKeyValueInput,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

type Zone = 'local' | 'utc';

const TEXT_FIELDS: ReadonlyArray<{
  id: 'title' | 'location' | 'url' | 'organizer' | 'attendees' | 'description';
  label: string;
  placeholder: string;
  wide?: boolean;
  multiline?: boolean;
}> = [
  { id: 'title', label: 'Title', placeholder: 'Team standup', wide: true },
  { id: 'location', label: 'Location', placeholder: 'Room 4, or a meeting link' },
  { id: 'url', label: 'URL', placeholder: 'https://example.com/event' },
  { id: 'organizer', label: 'Organizer Email', placeholder: 'host@example.com' },
  { id: 'attendees', label: 'Attendee Emails', placeholder: 'a@example.com, b@example.com' },
  { id: 'description', label: 'Description', placeholder: 'What the event is about', wide: true, multiline: true },
];

const URL_PARAMS = ['title', 'start', 'end', 'location', 'description', 'url', 'organizer', 'attendees'] as const;

const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';
const paneClass =
  'bg-gray-50 text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 cursor-default resize-y font-mono text-xs min-h-[260px]';
const btnClass =
  'bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const btnSecondaryClass =
  'border border-gray-300 hover:border-gray-900 text-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

/** Minutes to add to a wall time to reach UTC, DST-correct for that instant. */
function offsetFor(zone: Zone, wallTime: string): number {
  if (zone === 'utc') return 0;
  const d = new Date(wallTime || Date.now());
  return isNaN(d.getTime()) ? new Date().getTimezoneOffset() : d.getTimezoneOffset();
}

export function IcalGenerator() {
  const [event, setEvent] = useState<IcalEvent>({});
  const [zone, setZone] = useState<Zone>('local');
  const [zoneName, setZoneName] = useState('local time');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // UID and DTSTAMP are fixed for the life of the page, so the output does not
  // change on every keystroke.
  const identity = useRef({ uid: '', dtstamp: '' });
  if (!identity.current.uid) {
    identity.current = {
      uid: `${Date.now()}-${Math.floor(Math.random() * 1e9)}@devoven.com`,
      dtstamp: new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'),
    };
  }

  // Each field is its own URL param (?title=Standup&start=…);
  // ?from= still accepts the old key=value payload so shared links keep working.
  useEffect(() => {
    try {
      setZoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time');
    } catch {
      /* keep the fallback label */
    }

    const params = new URLSearchParams(window.location.search);
    const seeded: IcalEvent = params.get('from')
      ? fieldsToEvent(parseKeyValueInput(params.get('from') as string))
      : {};
    for (const key of URL_PARAMS) {
      const value = params.get(key);
      if (value !== null) seeded[key] = value;
    }
    if (params.get('allDay') === 'true') seeded.allDay = true;
    if (params.get('start') && /^\d{4}-\d{2}-\d{2}$/.test(params.get('start') as string)) seeded.allDay = true;
    if (Object.keys(seeded).length > 0) setEvent(seeded);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ ...Object.fromEntries(URL_PARAMS.map((key) => [key, event[key]])), allDay: event.allDay })

  const ics = useMemo(
    () => buildIcal(event, { ...identity.current, offsetMinutes: offsetFor(zone, event.start ?? '') }),
    [event, zone]
  );
  const summary = useMemo(() => (ics ? describeIcal(ics) : ''), [ics]);
  const empty = isEmptyEvent(event);

  const setField = (id: keyof IcalEvent, value: string | boolean) =>
    setEvent(prev => ({ ...prev, [id]: value }));

  // Switching between a date and a datetime changes the shape of the value.
  const toggleAllDay = (allDay: boolean) =>
    setEvent(prev => ({
      ...prev,
      allDay,
      start: allDay ? (prev.start ?? '').slice(0, 10) : (prev.start ? prev.start.slice(0, 10) + 'T09:00' : ''),
      end: allDay ? (prev.end ?? '').slice(0, 10) : (prev.end ? prev.end.slice(0, 10) + 'T10:00' : ''),
    }));

  const downloadIcs = () => {
    const blob = new Blob([ics + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = icalFilename(event) + '.ics';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importIcs = () => {
    const imported = icalToEvent(importText, offsetFor(zone, ''));
    if (Object.keys(imported).length === 0) {
      setImportError('No event found. Paste the contents of an .ics file containing a BEGIN:VEVENT block.');
      return;
    }
    setEvent(imported);
    setImportError('');
    setImportText('');
  };

  return (
    <Panel
      title="iCal Event Generator"
      description="Fill in the event details to build an [1 iCalendar (.ics) 2] file that Google Calendar, Outlook and Apple Calendar all import. Times are converted to UTC before export. Every field can be pre-filled from the URL, e.g. [1 ?title=Standup&start=2026-09-01T09:30 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* When */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* The whole row toggles, so the handler sits on the label, not the box. */}
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => toggleAllDay(!event.allDay)}>
                <div
                  className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${event.allDay ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-400'}`}
                >
                  {event.allDay && <span className="text-white text-xs leading-none">✓</span>}
                </div>
                <span className={labelClass + ' mb-0'}>All-day event</span>
              </label>

              {!event.allDay && (
                <div className="flex items-center gap-3">
                  <span className={labelClass + ' mb-0'}>Times are in</span>
                  <select
                    className="bg-white text-gray-900 border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
                    value={zone}
                    onChange={e => setZone(e.target.value as Zone)}
                  >
                    <option value="local">{zoneName}</option>
                    <option value="utc">UTC</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelClass} htmlFor="ical-start">{event.allDay ? 'Start Date' : 'Starts'}</label>
                <input
                  id="ical-start"
                  className={inputClass}
                  type={event.allDay ? 'date' : 'datetime-local'}
                  value={event.start ?? ''}
                  onChange={e => setField('start', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ical-end">{event.allDay ? 'End Date (inclusive)' : 'Ends'}</label>
                <input
                  id="ical-end"
                  className={inputClass}
                  type={event.allDay ? 'date' : 'datetime-local'}
                  value={event.end ?? ''}
                  onChange={e => setField('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* What */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {TEXT_FIELDS.map(field => (
              <div key={field.id} className={field.wide ? 'md:col-span-2' : undefined}>
                <label className={labelClass} htmlFor={`ical-${field.id}`}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    id={`ical-${field.id}`}
                    className={inputClass + ' resize-y'}
                    rows={3}
                    placeholder={field.placeholder}
                    value={event[field.id] ?? ''}
                    onChange={e => setField(field.id, e.target.value)}
                  />
                ) : (
                  <input
                    id={`ical-${field.id}`}
                    className={inputClass}
                    autoComplete="off"
                    placeholder={field.placeholder}
                    value={event[field.id] ?? ''}
                    onChange={e => setField(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Output */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <p className={labelClass}>Event summary</p>
              <textarea
                className={paneClass}
                placeholder="Fill in a field to see the event summary"
                value={summary}
                readOnly
              />
            </div>
            <div className="flex flex-col gap-3">
              <p className={labelClass}>iCalendar (.ics)</p>
              <textarea
                className={paneClass}
                placeholder="BEGIN:VCALENDAR…"
                value={ics}
                readOnly
              />
              <button className={btnClass} onClick={downloadIcs} disabled={empty}>
                Download .ics
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="border-t border-gray-200 pt-6 flex flex-col gap-3">
            <p className={labelClass}>Load an existing event</p>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y font-mono text-xs"
                rows={4}
                placeholder="Paste the contents of an .ics file here to fill the form above…"
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportError(''); }}
              />
            </FileTextArea>
            {importError && <p className="text-red-500 text-sm">{importError}</p>}
            <div>
              <button className={btnSecondaryClass} onClick={importIcs} disabled={!importText.trim()}>
                Load into form
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
