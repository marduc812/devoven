// Pure TypeScript — no browser APIs. Date is allowed.

export interface IcalFields {
  title?: string;
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  url?: string;
  organizer?: string;
  attendees?: string;
  uid?: string;
  [key: string]: string | undefined;
}

/**
 * Parse key=value lines into an IcalFields object.
 * Supports both `key=value` and `key: value` formats.
 */
export function parseKeyValueInput(input: string): IcalFields {
  const fields: IcalFields = {};
  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=:]+?)\s*[=:]\s*(.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      fields[key] = val;
    }
  }
  return fields;
}

/**
 * Parse a date string (ISO 8601 or "YYYY-MM-DD HH:MM" or "YYYY-MM-DD") to iCal DTSTART/DTEND format.
 * Returns YYYYMMDDTHHMMSSZ for datetime or YYYYMMDD for all-day.
 */
export function parseDateToIcal(dateStr: string): string {
  const trimmed = dateStr.trim();

  // Try ISO 8601 with time
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:Z|[+-]\d{2}:\d{2})?$/);
  if (isoMatch) {
    const [, yr, mo, dy, hr, mi, se] = isoMatch;
    return `${yr}${mo}${dy}T${hr}${mi}${se || '00'}Z`;
  }

  // Try date-only
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
  }

  // Fallback: try to parse with Date
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yr = d.getUTCFullYear().toString();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dy = String(d.getUTCDate()).padStart(2, '0');
    const hr = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    const se = String(d.getUTCSeconds()).padStart(2, '0');
    return `${yr}${mo}${dy}T${hr}${mi}${se}Z`;
  }

  return trimmed; // Return as-is if we can't parse
}

function escapeIcalText(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold iCal content lines at 75 octets per RFC 5545.
 */
function foldIcalLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function generateUid(): string {
  // Simple UID without crypto (pure math)
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000000);
  return `${ts}-${rand}@devoven.com`;
}

/**
 * Generate an iCalendar (.ics) VEVENT from structured key=value input.
 */
export function generateIcal(input: string): string {
  if (!input.trim()) return '';

  const fields = parseKeyValueInput(input);
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//DevOven//iCal Generator//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('BEGIN:VEVENT');

  // UID
  const uid = fields['uid'] || generateUid();
  lines.push(foldIcalLine('UID:' + uid));

  // DTSTAMP (now)
  const now = new Date();
  const stamp = parseDateToIcal(now.toISOString());
  lines.push('DTSTAMP:' + stamp);

  // DTSTART
  const startStr = fields['start'] || fields['dtstart'] || '';
  if (startStr) {
    const startIcal = parseDateToIcal(startStr);
    // All-day events use DATE value type
    if (startIcal.length === 8) {
      lines.push(foldIcalLine('DTSTART;VALUE=DATE:' + startIcal));
    } else {
      lines.push(foldIcalLine('DTSTART:' + startIcal));
    }
  }

  // DTEND
  const endStr = fields['end'] || fields['dtend'] || '';
  if (endStr) {
    const endIcal = parseDateToIcal(endStr);
    if (endIcal.length === 8) {
      lines.push(foldIcalLine('DTEND;VALUE=DATE:' + endIcal));
    } else {
      lines.push(foldIcalLine('DTEND:' + endIcal));
    }
  }

  // SUMMARY (title)
  const title = fields['title'] || fields['summary'] || '';
  if (title) {
    lines.push(foldIcalLine('SUMMARY:' + escapeIcalText(title)));
  }

  // LOCATION
  const location = fields['location'] || '';
  if (location) {
    lines.push(foldIcalLine('LOCATION:' + escapeIcalText(location)));
  }

  // DESCRIPTION
  const description = fields['description'] || '';
  if (description) {
    lines.push(foldIcalLine('DESCRIPTION:' + escapeIcalText(description)));
  }

  // URL
  const url = fields['url'] || '';
  if (url) {
    lines.push(foldIcalLine('URL:' + url));
  }

  // ORGANIZER
  const organizer = fields['organizer'] || '';
  if (organizer) {
    const hasMailto = organizer.startsWith('mailto:');
    lines.push(foldIcalLine('ORGANIZER:' + (hasMailto ? organizer : 'mailto:' + organizer)));
  }

  // ATTENDEES
  const attendees = fields['attendees'] || fields['attendee'] || '';
  if (attendees) {
    const list = attendees.split(/[;,]/).map(a => a.trim()).filter(Boolean);
    for (const att of list) {
      const hasMailto = att.startsWith('mailto:');
      lines.push(foldIcalLine('ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT:' + (hasMailto ? att : 'mailto:' + att)));
    }
  }

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Parse an iCalendar string back to structured key=value display.
 */
export function parseIcal(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('BEGIN:VCALENDAR') && !trimmed.includes('BEGIN:VEVENT')) {
    return 'Error: Not a valid iCalendar file';
  }

  // Unfold lines
  const unfolded = trimmed.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const result: string[] = [];
  let inEvent = false;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; continue; }
    if (line === 'END:VEVENT') { inEvent = false; continue; }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propFull = line.slice(0, colonIdx);
    const val = line.slice(colonIdx + 1).trim();

    const propName = propFull.split(';')[0].toUpperCase();

    const unescaped = val
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');

    switch (propName) {
      case 'SUMMARY': result.push('title: ' + unescaped); break;
      case 'DTSTART': result.push('start: ' + formatIcalDate(unescaped)); break;
      case 'DTEND': result.push('end: ' + formatIcalDate(unescaped)); break;
      case 'LOCATION': result.push('location: ' + unescaped); break;
      case 'DESCRIPTION': result.push('description: ' + unescaped); break;
      case 'URL': result.push('url: ' + unescaped); break;
      case 'ORGANIZER': result.push('organizer: ' + unescaped.replace(/^mailto:/i, '')); break;
      case 'ATTENDEE': result.push('attendee: ' + unescaped.replace(/^mailto:/i, '')); break;
      case 'UID': result.push('uid: ' + unescaped); break;
      case 'DTSTAMP': result.push('stamp: ' + formatIcalDate(unescaped)); break;
    }
  }

  return result.join('\n');
}

function formatIcalDate(icalDate: string): string {
  // YYYYMMDDTHHMMSSZ or YYYYMMDD
  const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(icalDate);
  if (allDay) {
    return `${allDay[1]}-${allDay[2]}-${allDay[3]}`;
  }
  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(icalDate);
  if (dt) {
    return `${dt[1]}-${dt[2]}-${dt[3]} ${dt[4]}:${dt[5]}:${dt[6]} UTC`;
  }
  return icalDate;
}

/**
 * Auto-detect whether input looks like iCal or key=value.
 */
export function detectIcalOrInput(input: string): 'ical' | 'input' {
  const trimmed = input.trim();
  if (trimmed.startsWith('BEGIN:VCALENDAR') || trimmed.startsWith('BEGIN:VEVENT')) return 'ical';
  return 'input';
}
