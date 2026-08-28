import {
  addDays,
  buildIcal,
  describeIcal,
  detectIcalOrInput,
  fieldsToEvent,
  formatIcalDate,
  icalFilename,
  icalToEvent,
  isEmptyEvent,
  parseKeyValueInput,
  toIcalDate,
  toIcalUtc,
} from '../Components/Functions/IcalTools/logic';

const OPTS = { uid: 'test-uid@devoven.com', dtstamp: '20240101T000000Z', offsetMinutes: 0 };

describe('toIcalUtc', () => {
  it('formats a wall time already in UTC', () => {
    expect(toIcalUtc('2024-01-15T14:00', 0)).toBe('20240115T140000Z');
  });

  it('shifts a wall time by the zone offset', () => {
    // UTC+2 reports getTimezoneOffset() === -120, so 14:00 local is 12:00 UTC.
    expect(toIcalUtc('2024-01-15T14:00', -120)).toBe('20240115T120000Z');
    expect(toIcalUtc('2024-01-15T14:00', 300)).toBe('20240115T190000Z');
  });

  it('rolls over the date when the offset crosses midnight', () => {
    expect(toIcalUtc('2024-01-15T23:30', 60)).toBe('20240116T003000Z');
    expect(toIcalUtc('2024-01-15T00:30', -60)).toBe('20240114T233000Z');
  });

  it('accepts a space separator and explicit seconds', () => {
    expect(toIcalUtc('2024-01-15 14:00:45', 0)).toBe('20240115T140045Z');
  });

  it('returns unparseable input unchanged', () => {
    expect(toIcalUtc('not a date', 0)).toBe('not a date');
  });
});

describe('toIcalDate and addDays', () => {
  it('strips the dashes from a date', () => {
    expect(toIcalDate('2024-12-25')).toBe('20241225');
  });

  it('shifts dates across month and year boundaries', () => {
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });
});

describe('parseKeyValueInput and fieldsToEvent', () => {
  it('parses key=value and key: value pairs', () => {
    const fields = parseKeyValueInput('title=My Event\nstart: 2024-01-15 10:00\n# ignored');
    expect(fields.title).toBe('My Event');
    expect(fields.start).toBe('2024-01-15 10:00');
    expect(fields['# ignored']).toBeUndefined();
  });

  it('normalizes a loose datetime into the form input shape', () => {
    expect(fieldsToEvent({ start: '2024-01-15 10:00' }).start).toBe('2024-01-15T10:00');
  });

  it('marks a date-only start as an all-day event', () => {
    expect(fieldsToEvent({ start: '2024-12-25' }).allDay).toBe(true);
    expect(fieldsToEvent({ start: '2024-12-25T10:00' }).allDay).toBe(false);
  });

  it('applies the field aliases', () => {
    const event = fieldsToEvent({ summary: 'Standup', dtstart: '2024-01-15 09:00', guests: 'a@x.test', host: 'h@x.test' });
    expect(event.title).toBe('Standup');
    expect(event.start).toBe('2024-01-15T09:00');
    expect(event.attendees).toBe('a@x.test');
    expect(event.organizer).toBe('h@x.test');
  });

  it('drops empty values instead of emitting blank keys', () => {
    expect(fieldsToEvent({ title: 'x', location: '' })).toEqual({ title: 'x' });
  });
});

describe('buildIcal', () => {
  it('returns empty string for an empty event', () => {
    expect(buildIcal({}, OPTS)).toBe('');
    expect(buildIcal({ title: '  ' }, OPTS)).toBe('');
  });

  it('wraps a VEVENT in a VCALENDAR', () => {
    const result = buildIcal({ title: 'My Event' }, OPTS);
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('VERSION:2.0');
    expect(result).toContain('BEGIN:VEVENT');
    expect(result).toContain('END:VEVENT');
    expect(result).toContain('END:VCALENDAR');
  });

  it('uses the supplied UID and DTSTAMP rather than the clock', () => {
    const result = buildIcal({ title: 'Event' }, OPTS);
    expect(result).toContain('UID:test-uid@devoven.com');
    expect(result).toContain('DTSTAMP:20240101T000000Z');
    expect(result).toBe(buildIcal({ title: 'Event' }, OPTS));
  });

  it('writes DTSTART and DTEND in UTC', () => {
    const result = buildIcal({ title: 'Event', start: '2024-01-15T10:00', end: '2024-01-15T11:00' }, OPTS);
    expect(result).toContain('DTSTART:20240115T100000Z');
    expect(result).toContain('DTEND:20240115T110000Z');
  });

  it('converts entered local time to UTC', () => {
    const result = buildIcal({ start: '2024-01-15T10:00' }, { ...OPTS, offsetMinutes: -120 });
    expect(result).toContain('DTSTART:20240115T080000Z');
  });

  it('uses exclusive DATE values for all-day events', () => {
    const result = buildIcal({ title: 'Holiday', start: '2024-12-25', end: '2024-12-25', allDay: true }, OPTS);
    expect(result).toContain('DTSTART;VALUE=DATE:20241225');
    expect(result).toContain('DTEND;VALUE=DATE:20241226');
  });

  it('defaults an all-day event with no end to a single day', () => {
    const result = buildIcal({ start: '2024-12-25', allDay: true }, OPTS);
    expect(result).toContain('DTEND;VALUE=DATE:20241226');
  });

  it('adds mailto: to organizer and attendees without duplicating it', () => {
    const result = buildIcal({ organizer: 'host@example.com', attendees: 'a@example.com, mailto:b@example.com' }, OPTS);
    expect(result).toContain('ORGANIZER:mailto:host@example.com');
    expect(result).toContain('mailto:a@example.com');
    expect(result).toContain('mailto:b@example.com');
    expect(result).not.toContain('mailto:mailto:');
    expect(result.match(/ATTENDEE/g)).toHaveLength(2);
    // A normal-length address must not be folded across two lines.
    expect(result).toContain('ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:a@example.com');
  });

  it('escapes commas, semicolons and newlines', () => {
    expect(buildIcal({ description: 'a,b;c\nd' }, OPTS)).toContain('DESCRIPTION:a\\,b\\;c\\nd');
  });

  it('folds lines longer than 75 characters', () => {
    const result = buildIcal({ description: 'x'.repeat(300) }, OPTS);
    expect(result.split('\r\n').every(line => line.length <= 75)).toBe(true);
  });
});

describe('isEmptyEvent and icalFilename', () => {
  it('treats whitespace-only fields as empty', () => {
    expect(isEmptyEvent({ title: ' ', location: '' })).toBe(true);
    expect(isEmptyEvent({ location: 'Room 4' })).toBe(false);
  });

  it('slugifies the title, falling back to a default', () => {
    expect(icalFilename({ title: 'Team Standup!' })).toBe('team-standup');
    expect(icalFilename({})).toBe('event');
  });
});

describe('formatIcalDate', () => {
  it('renders a timed stamp with the weekday', () => {
    expect(formatIcalDate('20240115T100000Z')).toBe('Mon, 15 Jan 2024, 10:00 UTC');
  });

  it('renders an all-day date without a time', () => {
    expect(formatIcalDate('20241225')).toBe('Wed, 25 Dec 2024');
  });

  it('returns unrecognised input unchanged', () => {
    expect(formatIcalDate('whenever')).toBe('whenever');
  });
});

describe('describeIcal', () => {
  it('returns empty for empty input', () => {
    expect(describeIcal('')).toBe('');
  });

  it('returns an error for input that is not iCalendar', () => {
    expect(describeIcal('title=Event')).toContain('Error');
  });

  it('renders aligned label/value rows', () => {
    const ics = buildIcal({ title: 'Team Meeting', start: '2024-01-15T10:00', end: '2024-01-15T11:30', location: 'Office' }, OPTS);
    const summary = describeIcal(ics);
    expect(summary).toContain('Title');
    expect(summary).toContain('Team Meeting');
    expect(summary.split('\n')[0]).toBe('Title      Team Meeting');
    expect(summary).toContain('Starts     Mon, 15 Jan 2024, 10:00 UTC');
    expect(summary).toContain('Duration   1 hour 30 minutes');
    expect(summary).toContain('Office');
  });

  it('shows the inclusive last day for an all-day event', () => {
    const ics = buildIcal({ title: 'Trip', start: '2024-12-24', end: '2024-12-26', allDay: true }, OPTS);
    const summary = describeIcal(ics);
    expect(summary).toContain('Starts');
    expect(summary).toContain('Tue, 24 Dec 2024');
    expect(summary).toContain('Thu, 26 Dec 2024');
    expect(summary).toContain('All day');
  });

  it('lists every attendee on one row', () => {
    const ics = buildIcal({ title: 'Event', attendees: 'a@x.test, b@x.test' }, OPTS);
    expect(describeIcal(ics)).toContain('Attendees');
    expect(describeIcal(ics)).toContain('a@x.test, b@x.test');
  });

  it('unfolds a folded description', () => {
    const ics = buildIcal({ description: 'z'.repeat(200) }, OPTS);
    expect(describeIcal(ics)).toContain('z'.repeat(200));
  });
});

describe('icalToEvent', () => {
  it('returns nothing for input that is not iCalendar', () => {
    expect(icalToEvent('title=Event', 0)).toEqual({});
  });

  it('round-trips a timed event', () => {
    const event = { title: 'Team Meeting', start: '2024-01-15T10:00', end: '2024-01-15T11:00', location: 'Office', description: 'Weekly', url: 'https://example.com', organizer: 'host@example.com', attendees: 'a@x.test, b@x.test' };
    expect(icalToEvent(buildIcal(event, OPTS), 0)).toEqual(event);
  });

  it('round-trips a timed event through a non-zero offset', () => {
    const event = { title: 'Standup', start: '2024-01-15T10:00', end: '2024-01-15T10:15' };
    expect(icalToEvent(buildIcal(event, { ...OPTS, offsetMinutes: -180 }), -180)).toEqual(event);
  });

  it('round-trips an all-day event, undoing the exclusive DTEND', () => {
    const event = { title: 'Trip', start: '2024-12-24', end: '2024-12-26', allDay: true };
    expect(icalToEvent(buildIcal(event, OPTS), 0)).toEqual(event);
  });

  it('reads an .ics written by another tool', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      'SUMMARY:Imported', 'DTSTART:20240115T090000Z', 'DTEND:20240115T100000Z',
      'ORGANIZER:mailto:host@example.com', 'ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:a@x.test',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    expect(icalToEvent(ics, 0)).toEqual({
      title: 'Imported',
      start: '2024-01-15T09:00',
      end: '2024-01-15T10:00',
      organizer: 'host@example.com',
      attendees: 'a@x.test',
    });
  });
});

describe('detectIcalOrInput', () => {
  it('detects iCal', () => {
    expect(detectIcalOrInput('BEGIN:VCALENDAR\nBEGIN:VEVENT\nEND:VEVENT\nEND:VCALENDAR')).toBe('ical');
  });

  it('detects input', () => {
    expect(detectIcalOrInput('title=My Event')).toBe('input');
  });
});
