export type QrType =
  | 'url'
  | 'vcard'
  | 'mecard'
  | 'wifi'
  | 'geo'
  | 'email'
  | 'phone'
  | 'sms'
  | 'vevent'
  | 'plain';

export interface QrParseResult {
  type: QrType;
  label: string;
  fields: Array<{ key: string; value: string }>;
  raw: string;
}

function parseWifi(raw: string): QrParseResult {
  const fields: Array<{ key: string; value: string }> = [];
  const t = raw.replace(/^WIFI:/i, '').replace(/;+$/, '');
  const parts = t.split(';');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const k = part.slice(0, colon).trim();
    const v = part.slice(colon + 1).trim();
    if (!k) continue;
    const keyMap: Record<string, string> = {
      T: 'Security Type',
      S: 'SSID',
      P: 'Password',
      H: 'Hidden',
    };
    fields.push({ key: keyMap[k] || k, value: v });
  }
  return { type: 'wifi', label: 'WiFi Configuration', fields: fields, raw: raw };
}

function parseGeo(raw: string): QrParseResult {
  const body = raw.slice(4);
  const parts = body.split(',');
  const fields: Array<{ key: string; value: string }> = [
    { key: 'Latitude', value: parts[0] || '' },
    { key: 'Longitude', value: parts[1] || '' },
  ];
  if (parts[2]) fields.push({ key: 'Altitude', value: parts[2] });
  return { type: 'geo', label: 'Geographic Coordinates', fields: fields, raw: raw };
}

function parseMailto(raw: string): QrParseResult {
  const parts = raw.replace(/^mailto:/i, '').split('?');
  const fields: Array<{ key: string; value: string }> = [
    { key: 'To', value: parts[0] },
  ];
  if (parts[1]) {
    const params = parts[1].split('&');
    for (let i = 0; i < params.length; i++) {
      const eq = params[i].indexOf('=');
      if (eq === -1) continue;
      const k = params[i].slice(0, eq);
      const v = decodeURIComponent(params[i].slice(eq + 1));
      const keyMap: Record<string, string> = {
        subject: 'Subject',
        body: 'Body',
        cc: 'CC',
        bcc: 'BCC',
      };
      fields.push({ key: keyMap[k.toLowerCase()] || k, value: v });
    }
  }
  return { type: 'email', label: 'Email', fields: fields, raw: raw };
}

function parseTel(raw: string): QrParseResult {
  const number = raw.replace(/^tel:/i, '');
  return {
    type: 'phone',
    label: 'Phone Number',
    fields: [{ key: 'Number', value: number }],
    raw: raw,
  };
}

function parseSms(raw: string): QrParseResult {
  const body = raw.replace(/^(?:smsto|sms):/i, '');
  const colon = body.indexOf(':');
  const fields: Array<{ key: string; value: string }> = [];
  if (colon === -1) {
    fields.push({ key: 'Number', value: body });
  } else {
    fields.push({ key: 'Number', value: body.slice(0, colon) });
    fields.push({ key: 'Message', value: body.slice(colon + 1) });
  }
  return { type: 'sms', label: 'SMS', fields: fields, raw: raw };
}

function parseVcard(raw: string): QrParseResult {
  const lines = raw.split(/\r?\n/);
  const fields: Array<{ key: string; value: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.toUpperCase() === 'BEGIN:VCARD' || line.toUpperCase() === 'END:VCARD') continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const k = line.slice(0, colon).split(';')[0].toUpperCase();
    const v = line.slice(colon + 1).trim();
    const keyMap: Record<string, string> = {
      FN: 'Full Name',
      N: 'Name',
      ORG: 'Organization',
      TEL: 'Phone',
      EMAIL: 'Email',
      ADR: 'Address',
      URL: 'Website',
      NOTE: 'Note',
      VERSION: 'Version',
      TITLE: 'Title',
    };
    fields.push({ key: keyMap[k] || k, value: v });
  }
  return { type: 'vcard', label: 'vCard Contact', fields: fields, raw: raw };
}

function parseMecard(raw: string): QrParseResult {
  const body = raw.replace(/^MECARD:/i, '').replace(/;+$/, '');
  const fields: Array<{ key: string; value: string }> = [];
  const parts = body.split(';');
  for (let i = 0; i < parts.length; i++) {
    const colon = parts[i].indexOf(':');
    if (colon === -1) continue;
    const k = parts[i].slice(0, colon).trim().toUpperCase();
    const v = parts[i].slice(colon + 1).trim();
    const keyMap: Record<string, string> = {
      N: 'Name',
      TEL: 'Phone',
      EMAIL: 'Email',
      ADR: 'Address',
      URL: 'Website',
      NOTE: 'Note',
      BDAY: 'Birthday',
    };
    fields.push({ key: keyMap[k] || k, value: v });
  }
  return { type: 'mecard', label: 'MECARD Contact', fields: fields, raw: raw };
}

function parseVevent(raw: string): QrParseResult {
  const lines = raw.split(/\r?\n/);
  const fields: Array<{ key: string; value: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.toUpperCase() === 'BEGIN:VCALENDAR' || line.toUpperCase() === 'END:VCALENDAR' ||
        line.toUpperCase() === 'BEGIN:VEVENT' || line.toUpperCase() === 'END:VEVENT') continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const k = line.slice(0, colon).split(';')[0].toUpperCase();
    const v = line.slice(colon + 1).trim();
    const keyMap: Record<string, string> = {
      SUMMARY: 'Summary',
      DTSTART: 'Start',
      DTEND: 'End',
      LOCATION: 'Location',
      DESCRIPTION: 'Description',
      URL: 'URL',
      ORGANIZER: 'Organizer',
    };
    if (keyMap[k]) fields.push({ key: keyMap[k], value: v });
  }
  return { type: 'vevent', label: 'Calendar Event', fields: fields, raw: raw };
}

function parseUrl(raw: string): QrParseResult {
  const fields: Array<{ key: string; value: string }> = [];
  try {
    const u = new URL(raw);
    fields.push({ key: 'Full URL', value: raw });
    fields.push({ key: 'Protocol', value: u.protocol.replace(':', '') });
    fields.push({ key: 'Host', value: u.hostname });
    if (u.port) fields.push({ key: 'Port', value: u.port });
    if (u.pathname && u.pathname !== '/') fields.push({ key: 'Path', value: u.pathname });
    if (u.search) fields.push({ key: 'Query', value: u.search.slice(1) });
    if (u.hash) fields.push({ key: 'Fragment', value: u.hash.slice(1) });
  } catch (_) {
    fields.push({ key: 'URL', value: raw });
  }
  return { type: 'url', label: 'URL', fields: fields, raw: raw };
}

export function parseQrData(raw: string): QrParseResult {
  const t = raw.trim();
  const upper = t.toUpperCase();

  if (upper.startsWith('WIFI:')) return parseWifi(t);
  if (upper.startsWith('GEO:')) return parseGeo(t);
  if (upper.startsWith('MAILTO:')) return parseMailto(t);
  if (upper.startsWith('TEL:')) return parseTel(t);
  if (upper.startsWith('SMSTO:') || upper.startsWith('SMS:')) return parseSms(t);
  if (upper.startsWith('BEGIN:VCARD')) return parseVcard(t);
  if (upper.startsWith('MECARD:')) return parseMecard(t);
  if (upper.startsWith('BEGIN:VCALENDAR') || upper.startsWith('BEGIN:VEVENT')) return parseVevent(t);
  if (/^https?:\/\//i.test(t)) return parseUrl(t);

  return {
    type: 'plain',
    label: 'Plain Text',
    fields: [{ key: 'Content', value: t }],
    raw: t,
  };
}

export function formatQrResult(result: QrParseResult): string {
  const lines = ['Type: ' + result.label, ''];
  for (let i = 0; i < result.fields.length; i++) {
    lines.push(result.fields[i].key + ': ' + result.fields[i].value);
  }
  return lines.join('\n');
}

export function processQrData(input: string): string {
  if (!input.trim()) throw new Error('No input provided');
  const result = parseQrData(input);
  return formatQrResult(result);
}
