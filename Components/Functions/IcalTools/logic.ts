// Pure TypeScript — no browser APIs, no ambient clock. Anything time-dependent
// (UID, DTSTAMP, the UTC offset of the user's zone) is passed in by the caller.

export interface IcalEvent {
  title?: string;
  /** 'YYYY-MM-DDTHH:mm' for a timed event, 'YYYY-MM-DD' when allDay. */
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  url?: string;
  organizer?: string;
  /** Comma or semicolon separated. */
  attendees?: string;
}

export interface BuildIcalOptions {
  /** Event UID. Pass a stable value so the output does not churn while typing. */
  uid: string;
  /** DTSTAMP, as 'YYYYMMDDTHHMMSSZ'. */
  dtstamp: string;
  /**
   * Minutes to add to the entered wall time to reach UTC — the value
   * `Date.prototype.getTimezoneOffset()` returns for that instant.
   * 0 means the user entered UTC directly.
   */
  offsetMinutes: number;
}

/** Legacy key=value input still accepted through `?from=`. */
export interface IcalFields {
  [key: string]: string | undefined;
}

/** Parse key=value (or key: value) lines into a flat field map. */
export function parseKeyValueInput(input: string): IcalFields {
  const fields: IcalFields = {};
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=:]+?)\s*[=:]\s*(.*)$/);
    if (match) fields[match[1].trim().toLowerCase()] = match[2].trim();
  }
  return fields;
}

/** Turn a flat key=value map into an event, applying the usual aliases. */
export function fieldsToEvent(fields: IcalFields): IcalEvent {
  const start = fields.start || fields.dtstart || '';
  const end = fields.end || fields.dtend || '';
  const event: IcalEvent = {
    title: fields.title || fields.summary,
    start: normalizeDateInput(start),
    end: normalizeDateInput(end),
    allDay: start ? /^\d{4}-\d{2}-\d{2}$/.test(start.trim()) : undefined,
    location: fields.location,
    description: fields.description || fields.notes,
    url: fields.url || fields.website,
    organizer: fields.organizer || fields.host,
    attendees: fields.attendees || fields.attendee || fields.guests,
  };
  for (const key of Object.keys(event) as (keyof IcalEvent)[]) {
    if (event[key] === undefined || event[key] === '') delete event[key];
  }
  return event;
}

/** Coerce loose date text into the shape the form inputs use. */
function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return trimmed;
  const dt = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (dt) return `${dt[1]}-${dt[2]}-${dt[3]}T${dt[4]}:${dt[5]}`;
  return trimmed;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' → 'YYYYMMDD'. */
export function toIcalDate(value: string): string {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + m[2] + m[3] : value.trim();
}

/**
 * 'YYYY-MM-DDTHH:mm' plus a UTC offset → 'YYYYMMDDTHHMMSSZ'.
 * The arithmetic is done on the parts, so no host timezone leaks in.
 */
export function toIcalUtc(value: string, offsetMinutes: number): string {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return value.trim();
  const [, yr, mo, dy, hr, mi, se] = m;
  const utc = Date.UTC(+yr, +mo - 1, +dy, +hr, +mi, +(se ?? 0)) + offsetMinutes * 60_000;
  const d = new Date(utc);
  return (
    d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'
  );
}

/** Shift a 'YYYY-MM-DD' by whole days. */
export function addDays(value: string, days: number): string {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value.trim();
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  d.setUTCDate(d.getUTCDate() + days);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
}

function escapeIcalText(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold content lines at 75 octets per RFC 5545. */
function foldIcalLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function clean(val: string | undefined): string {
  return (val ?? '').trim();
}

/** True when nothing worth exporting has been entered. */
export function isEmptyEvent(event: IcalEvent): boolean {
  return !clean(event.title) && !clean(event.start) && !clean(event.end) &&
    !clean(event.location) && !clean(event.description) && !clean(event.url) &&
    !clean(event.organizer) && !clean(event.attendees);
}

function mailto(value: string): string {
  return /^mailto:/i.test(value) ? value : 'mailto:' + value;
}

/** Build a full VCALENDAR wrapping one VEVENT. */
export function buildIcal(event: IcalEvent, opts: BuildIcalOptions): string {
  if (isEmptyEvent(event)) return '';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevOven//iCal Generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    foldIcalLine('UID:' + opts.uid),
    'DTSTAMP:' + opts.dtstamp,
  ];

  const start = clean(event.start);
  const end = clean(event.end);

  if (event.allDay) {
    if (start) lines.push('DTSTART;VALUE=DATE:' + toIcalDate(start));
    // DTEND is exclusive for all-day events: a one-day event ends the next day.
    if (start || end) lines.push('DTEND;VALUE=DATE:' + toIcalDate(addDays(end || start, 1)));
  } else {
    if (start) lines.push('DTSTART:' + toIcalUtc(start, opts.offsetMinutes));
    if (end) lines.push('DTEND:' + toIcalUtc(end, opts.offsetMinutes));
  }

  if (clean(event.title)) lines.push(foldIcalLine('SUMMARY:' + escapeIcalText(clean(event.title))));
  if (clean(event.location)) lines.push(foldIcalLine('LOCATION:' + escapeIcalText(clean(event.location))));
  if (clean(event.description)) lines.push(foldIcalLine('DESCRIPTION:' + escapeIcalText(clean(event.description))));
  if (clean(event.url)) lines.push(foldIcalLine('URL:' + clean(event.url)));
  if (clean(event.organizer)) lines.push(foldIcalLine('ORGANIZER:' + mailto(clean(event.organizer))));

  for (const att of clean(event.attendees).split(/[;,]/).map(a => a.trim()).filter(Boolean)) {
    // Only ROLE, so an ordinary address still fits on one unfolded line.
    lines.push(foldIcalLine('ATTENDEE;ROLE=REQ-PARTICIPANT:' + mailto(att)));
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/** The name a downloaded .ics should carry, without the extension. */
export function icalFilename(event: IcalEvent): string {
  const slug = clean(event.title).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return slug || 'event';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'YYYYMMDDTHHMMSSZ' or 'YYYYMMDD' → 'Tue, 15 Jan 2024, 10:00 UTC'. */
export function formatIcalDate(icalDate: string): string {
  const value = icalDate.trim();

  const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (allDay) {
    const d = new Date(Date.UTC(+allDay[1], +allDay[2] - 1, +allDay[3]));
    return `${WEEKDAYS[d.getUTCDay()]}, ${+allDay[3]} ${MONTHS[+allDay[2] - 1]} ${allDay[1]}`;
  }

  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
  if (dt) {
    const d = new Date(Date.UTC(+dt[1], +dt[2] - 1, +dt[3]));
    const zone = dt[7] ? ' UTC' : '';
    return `${WEEKDAYS[d.getUTCDay()]}, ${+dt[3]} ${MONTHS[+dt[2] - 1]} ${dt[1]}, ${dt[4]}:${dt[5]}${zone}`;
  }

  return value;
}

/** Minutes between two iCal timestamps, or null when they cannot be compared. */
function minutesBetween(startIcal: string, endIcal: string): number | null {
  const toMs = (v: string): number | null => {
    const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (allDay) return Date.UTC(+allDay[1], +allDay[2] - 1, +allDay[3]);
    const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(v);
    if (dt) return Date.UTC(+dt[1], +dt[2] - 1, +dt[3], +dt[4], +dt[5], +dt[6]);
    return null;
  };
  const a = toMs(startIcal);
  const b = toMs(endIcal);
  if (a === null || b === null || b < a) return null;
  return Math.round((b - a) / 60_000);
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 minutes';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days) parts.push(days + (days === 1 ? ' day' : ' days'));
  if (hours) parts.push(hours + (hours === 1 ? ' hour' : ' hours'));
  if (mins) parts.push(mins + (mins === 1 ? ' minute' : ' minutes'));
  return parts.join(' ');
}

/**
 * Render a VEVENT as an aligned, human-readable summary — what the calendar
 * will actually show, rather than the raw property lines.
 */
export function describeIcal(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('BEGIN:VCALENDAR') && !trimmed.includes('BEGIN:VEVENT')) {
    return 'Error: Not a valid iCalendar file (no BEGIN:VEVENT found)';
  }

  const props = readEventProps(trimmed);
  if (props.length === 0) return 'Error: The VEVENT block is empty';

  const single: Record<string, string> = {};
  const attendees: string[] = [];
  let startIcal = '';
  let endIcal = '';
  let allDay = false;

  for (const { name, params, value } of props) {
    switch (name) {
      case 'SUMMARY': single.Title = value; break;
      case 'DTSTART':
        startIcal = value;
        allDay = params.includes('VALUE=DATE');
        break;
      case 'DTEND': endIcal = value; break;
      case 'LOCATION': single.Location = value; break;
      case 'DESCRIPTION': single.Description = value.replace(/\n/g, ' '); break;
      case 'URL': single.URL = value; break;
      case 'ORGANIZER': single.Organizer = value.replace(/^mailto:/i, ''); break;
      case 'ATTENDEE': attendees.push(value.replace(/^mailto:/i, '')); break;
      case 'UID': single.UID = value; break;
      case 'DTSTAMP': single.Created = formatIcalDate(value); break;
    }
  }

  if (startIcal) single.Starts = formatIcalDate(startIcal);
  if (endIcal) {
    // All-day DTEND is exclusive; show the last day the event actually covers.
    single.Ends = formatIcalDate(allDay ? toIcalDate(addDays(icalDateToIso(endIcal), -1)) : endIcal);
  }
  if (startIcal && endIcal) {
    const mins = minutesBetween(startIcal, endIcal);
    if (mins !== null) single.Duration = formatDuration(mins);
  }
  if (allDay) single['All day'] = 'Yes';
  if (attendees.length > 0) {
    single[attendees.length === 1 ? 'Attendee' : 'Attendees'] = attendees.join(', ');
  }

  // Read top to bottom the way someone reads an invitation, not in file order.
  const ORDER = [
    'Title', 'Starts', 'Ends', 'Duration', 'All day', 'Location',
    'Description', 'URL', 'Organizer', 'Attendee', 'Attendees', 'UID', 'Created',
  ];
  const all = ORDER.filter(label => single[label] !== undefined).map(label => [label, single[label]] as const);
  if (all.length === 0) return 'Error: The VEVENT block is empty';

  const width = Math.max(...all.map(([label]) => label.length));
  return all.map(([label, value]) => label.padEnd(width) + '   ' + value).join('\n');
}

/** 'YYYYMMDD' → 'YYYY-MM-DD', so date arithmetic helpers can be reused. */
function icalDateToIso(value: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : value.trim();
}

interface IcalProp { name: string; params: string; value: string }

/** Unfold the input and return the properties inside the first VEVENT. */
function readEventProps(input: string): IcalProp[] {
  const unfolded = input.replace(/\r?\n[ \t]/g, '');
  const props: IcalProp[] = [];
  let inEvent = !input.includes('BEGIN:VEVENT');

  for (const line of unfolded.split(/\r?\n/)) {
    if (line.trim() === 'BEGIN:VEVENT') { inEvent = true; continue; }
    if (line.trim() === 'END:VEVENT') break;
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const head = line.slice(0, colonIdx);
    const [name, ...params] = head.split(';');
    props.push({
      name: name.toUpperCase(),
      params: params.join(';').toUpperCase(),
      value: line.slice(colonIdx + 1).trim()
        .replace(/\\n/gi, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\'),
    });
  }
  return props;
}

/** Read an .ics back into form fields, converting UTC stamps to local wall time. */
export function icalToEvent(input: string, offsetMinutes: number): IcalEvent {
  const event: IcalEvent = {};
  const trimmed = input.trim();
  if (!trimmed.includes('BEGIN:VCALENDAR') && !trimmed.includes('BEGIN:VEVENT')) return event;

  const attendees: string[] = [];
  let endValue = '';

  for (const { name, params, value } of readEventProps(trimmed)) {
    switch (name) {
      case 'SUMMARY': event.title = value; break;
      case 'DTSTART':
        event.allDay = params.includes('VALUE=DATE');
        event.start = event.allDay ? icalDateToIso(value) : utcToLocalInput(value, offsetMinutes);
        break;
      case 'DTEND': endValue = value; break;
      case 'LOCATION': event.location = value; break;
      case 'DESCRIPTION': event.description = value; break;
      case 'URL': event.url = value; break;
      case 'ORGANIZER': event.organizer = value.replace(/^mailto:/i, ''); break;
      case 'ATTENDEE': attendees.push(value.replace(/^mailto:/i, '')); break;
    }
  }

  if (endValue) {
    // Undo the exclusive all-day DTEND so the form shows the last covered day.
    event.end = event.allDay
      ? addDays(icalDateToIso(endValue), -1)
      : utcToLocalInput(endValue, offsetMinutes);
  }
  if (attendees.length > 0) event.attendees = attendees.join(', ');
  if (!event.allDay) delete event.allDay;

  return event;
}

/** 'YYYYMMDDTHHMMSSZ' → 'YYYY-MM-DDTHH:mm' in the caller's zone. */
function utcToLocalInput(value: string, offsetMinutes: number): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value.trim());
  if (!m) return icalDateToIso(value);
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) - (m[7] ? offsetMinutes * 60_000 : 0);
  const d = new Date(ms);
  return (
    d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes())
  );
}

/** Auto-detect whether input looks like iCal or key=value. */
export function detectIcalOrInput(input: string): 'ical' | 'input' {
  const trimmed = input.trim();
  return trimmed.startsWith('BEGIN:VCALENDAR') || trimmed.startsWith('BEGIN:VEVENT') ? 'ical' : 'input';
}
