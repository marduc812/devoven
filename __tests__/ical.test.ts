import { generateIcal, parseIcal, parseDateToIcal, parseKeyValueInput, detectIcalOrInput } from '../Components/Functions/IcalTools/logic';

describe('parseDateToIcal', () => {
  it('converts ISO datetime to iCal format', () => {
    expect(parseDateToIcal('2024-01-15T14:00:00')).toBe('20240115T140000Z');
  });

  it('converts date-only to iCal format', () => {
    expect(parseDateToIcal('2024-01-15')).toBe('20240115');
  });

  it('handles datetime with space separator', () => {
    const result = parseDateToIcal('2024-01-15 14:00');
    expect(result).toMatch(/^20240115T1400/);
  });
});

describe('parseKeyValueInput', () => {
  it('parses key=value pairs', () => {
    const result = parseKeyValueInput('title=My Event\nstart=2024-01-15 10:00');
    expect(result.title).toBe('My Event');
    expect(result.start).toBe('2024-01-15 10:00');
  });
});

describe('generateIcal', () => {
  it('returns empty string for empty input', () => {
    expect(generateIcal('')).toBe('');
  });

  it('generates iCal with BEGIN/END markers', () => {
    const result = generateIcal('title=My Event\nstart=2024-01-15 10:00');
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
    expect(result).toContain('BEGIN:VEVENT');
    expect(result).toContain('END:VEVENT');
  });

  it('includes SUMMARY field for title', () => {
    const result = generateIcal('title=Team Meeting');
    expect(result).toContain('SUMMARY:Team Meeting');
  });

  it('includes DTSTART field', () => {
    const result = generateIcal('title=Event\nstart=2024-01-15 10:00');
    expect(result).toContain('DTSTART:20240115T100000Z');
  });

  it('includes DTEND field', () => {
    const result = generateIcal('title=Event\nstart=2024-01-15 10:00\nend=2024-01-15 11:00');
    expect(result).toContain('DTEND:20240115T110000Z');
  });

  it('includes LOCATION field', () => {
    const result = generateIcal('title=Event\nlocation=Conference Room A');
    expect(result).toContain('LOCATION:Conference Room A');
  });

  it('includes UID field', () => {
    const result = generateIcal('title=Event\nuid=test-uid-123');
    expect(result).toContain('UID:test-uid-123');
  });

  it('uses all-day format for date-only', () => {
    const result = generateIcal('title=Holiday\nstart=2024-12-25');
    expect(result).toContain('DTSTART;VALUE=DATE:20241225');
  });

  it('includes ORGANIZER field', () => {
    const result = generateIcal('title=Event\norganizer=host@example.com');
    expect(result).toContain('ORGANIZER:mailto:host@example.com');
  });

  it('includes ATTENDEE fields', () => {
    const result = generateIcal('title=Event\nattendees=a@example.com,b@example.com');
    expect(result).toContain('mailto:a@example.com');
    expect(result).toContain('mailto:b@example.com');
  });
});

describe('parseIcal', () => {
  it('returns empty for empty input', () => {
    expect(parseIcal('')).toBe('');
  });

  it('returns error for non-iCal input', () => {
    expect(parseIcal('title=Event')).toContain('Error');
  });

  it('parses SUMMARY to title', () => {
    const ical = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:My Meeting\r\nEND:VEVENT\r\nEND:VCALENDAR';
    const result = parseIcal(ical);
    expect(result).toContain('title: My Meeting');
  });

  it('parses LOCATION field', () => {
    const ical = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nLOCATION:Room 101\r\nEND:VEVENT\r\nEND:VCALENDAR';
    const result = parseIcal(ical);
    expect(result).toContain('location: Room 101');
  });

  it('round-trips an iCal event', () => {
    const input = 'title=Team Meeting\nstart=2024-01-15 10:00\nend=2024-01-15 11:00\nlocation=Office';
    const generated = generateIcal(input);
    const parsed = parseIcal(generated);
    expect(parsed).toContain('title: Team Meeting');
    expect(parsed).toContain('location: Office');
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
