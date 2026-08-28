// Pure TypeScript — no browser APIs.

export interface VcardFields {
  firstName?: string;
  lastName?: string;
  org?: string;
  title?: string;
  email?: string;
  phone?: string;
  url?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  note?: string;
}

/** The form fields, in render order, with the label and URL param each uses. */
export const VCARD_FIELDS: ReadonlyArray<{
  id: keyof VcardFields;
  label: string;
  placeholder: string;
  type?: 'email' | 'tel' | 'url';
}> = [
  { id: 'firstName', label: 'First Name', placeholder: 'Alice' },
  { id: 'lastName', label: 'Last Name', placeholder: 'Smith' },
  { id: 'org', label: 'Organization', placeholder: 'Acme Corp' },
  { id: 'title', label: 'Job Title', placeholder: 'Head of Engineering' },
  { id: 'email', label: 'Email', placeholder: 'alice@example.com', type: 'email' },
  { id: 'phone', label: 'Phone', placeholder: '+1 555 0100', type: 'tel' },
  { id: 'url', label: 'Website', placeholder: 'https://example.com', type: 'url' },
  { id: 'street', label: 'Street', placeholder: '1 Market St' },
  { id: 'city', label: 'City', placeholder: 'San Francisco' },
  { id: 'state', label: 'State / Region', placeholder: 'CA' },
  { id: 'postalCode', label: 'Postal Code', placeholder: '94105' },
  { id: 'country', label: 'Country', placeholder: 'United States' },
  { id: 'note', label: 'Note', placeholder: 'Met at the conference' },
];

/** Legacy key=value aliases, so old `?from=` links keep working. */
const KEY_ALIASES: Record<string, keyof VcardFields> = {
  fn: 'firstName',
  first: 'firstName',
  firstname: 'firstName',
  given: 'firstName',
  last: 'lastName',
  lastname: 'lastName',
  family: 'lastName',
  surname: 'lastName',
  company: 'org',
  organization: 'org',
  org: 'org',
  title: 'title',
  role: 'title',
  email: 'email',
  mail: 'email',
  phone: 'phone',
  tel: 'phone',
  mobile: 'phone',
  url: 'url',
  website: 'url',
  web: 'url',
  street: 'street',
  address: 'street',
  adr: 'street',
  city: 'city',
  locality: 'city',
  state: 'state',
  region: 'state',
  zip: 'postalCode',
  postcode: 'postalCode',
  postalcode: 'postalCode',
  country: 'country',
  note: 'note',
  notes: 'note',
};

/** Split "Alice Smith" into given / family, for inputs that carry one name. */
function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

/**
 * Parse key=value lines into a VcardFields object.
 * Supports both `key=value` and `key: value` formats.
 */
export function parseKeyValueInput(input: string): VcardFields {
  const fields: VcardFields = {};
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=:]+?)\s*[=:]\s*(.*)$/);
    if (!match) continue;

    const key = match[1].trim().toLowerCase();
    const val = match[2].trim();
    if (!val) continue;

    if (key === 'name') {
      const { firstName, lastName } = splitFullName(val);
      fields.firstName = firstName;
      if (lastName) fields.lastName = lastName;
      continue;
    }

    const target = KEY_ALIASES[key];
    if (target) fields[target] = val;
  }
  return fields;
}

/** Fold long vCard lines at 75 chars per RFC 6350. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function escapeVcardValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function clean(val: string | undefined): string {
  return (val ?? '').trim();
}

/** True when nothing has been filled in yet. */
export function isEmptyVcard(fields: VcardFields): boolean {
  return VCARD_FIELDS.every(f => !clean(fields[f.id]));
}

/** The name a downloaded .vcf should carry, without the extension. */
export function vcardFilename(fields: VcardFields): string {
  const name = [clean(fields.firstName), clean(fields.lastName)].filter(Boolean).join(' ') ||
    clean(fields.org) ||
    'contact';
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'contact';
}

/**
 * Build a vCard 3.0 (.vcf) from structured fields.
 * Deterministic: pass `rev` explicitly if you want a REV line.
 */
export function buildVcard(fields: VcardFields, opts: { rev?: string } = {}): string {
  if (isEmptyVcard(fields)) return '';

  const first = clean(fields.firstName);
  const last = clean(fields.lastName);
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fullName = [first, last].filter(Boolean).join(' ');
  lines.push(foldLine('FN:' + escapeVcardValue(fullName)));
  lines.push(foldLine('N:' + escapeVcardValue(last) + ';' + escapeVcardValue(first) + ';;;'));

  if (clean(fields.org)) lines.push(foldLine('ORG:' + escapeVcardValue(clean(fields.org))));
  if (clean(fields.title)) lines.push(foldLine('TITLE:' + escapeVcardValue(clean(fields.title))));

  for (const email of clean(fields.email).split(/[;,]/).map(e => e.trim()).filter(Boolean)) {
    lines.push(foldLine('EMAIL;TYPE=INTERNET:' + email));
  }

  for (const phone of clean(fields.phone).split(/[;,]/).map(p => p.trim()).filter(Boolean)) {
    lines.push(foldLine('TEL;TYPE=VOICE:' + phone));
  }

  if (clean(fields.url)) lines.push(foldLine('URL:' + clean(fields.url)));

  const adr = [fields.street, fields.city, fields.state, fields.postalCode, fields.country].map(clean);
  if (adr.some(Boolean)) {
    // ADR: po-box;ext-address;street;locality;region;postal-code;country
    lines.push(foldLine('ADR;TYPE=HOME:;;' + adr.map(escapeVcardValue).join(';')));
  }

  if (clean(fields.note)) lines.push(foldLine('NOTE:' + escapeVcardValue(clean(fields.note))));
  if (opts.rev) lines.push('REV:' + opts.rev);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/** Generate a vCard 3.0 (.vcf) from key=value lines. */
export function generateVcard(input: string): string {
  if (!input.trim()) return '';
  const rev = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
  const built = buildVcard(parseKeyValueInput(input), { rev });
  // A line of input that matched no known key still deserves a valid skeleton.
  return built || ['BEGIN:VCARD', 'VERSION:3.0', 'FN:', 'N:;;;;', 'REV:' + rev, 'END:VCARD'].join('\r\n');
}

/** Read a vCard back into form fields. */
export function vcardToFields(input: string): VcardFields {
  const fields: VcardFields = {};
  const trimmed = input.trim();
  if (!trimmed.includes('BEGIN:VCARD')) return fields;

  const unfolded = trimmed.replace(/\r?\n[ \t]/g, '');
  for (const line of unfolded.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propName = line.slice(0, colonIdx).split(';')[0].toUpperCase();
    const val = unescapeVcardValue(line.slice(colonIdx + 1).trim());
    if (!val) continue;

    switch (propName) {
      case 'N': {
        const parts = line.slice(colonIdx + 1).split(';');
        const last = unescapeVcardValue(parts[0]?.trim() ?? '');
        const first = unescapeVcardValue(parts[1]?.trim() ?? '');
        if (last) fields.lastName = last;
        if (first) fields.firstName = first;
        break;
      }
      case 'FN': {
        if (fields.firstName || fields.lastName) break;
        const { firstName, lastName } = splitFullName(val);
        fields.firstName = firstName;
        if (lastName) fields.lastName = lastName;
        break;
      }
      case 'ORG': fields.org = val.split(';')[0]; break;
      case 'TITLE': fields.title = val; break;
      case 'EMAIL': fields.email = fields.email ? fields.email + ', ' + val : val; break;
      case 'TEL': fields.phone = fields.phone ? fields.phone + ', ' + val : val; break;
      case 'URL': fields.url = val; break;
      case 'ADR': {
        const parts = line.slice(colonIdx + 1).split(';').map(p => unescapeVcardValue(p.trim()));
        // po-box;ext;street;locality;region;postal;country
        if (parts[2]) fields.street = parts[2];
        if (parts[3]) fields.city = parts[3];
        if (parts[4]) fields.state = parts[4];
        if (parts[5]) fields.postalCode = parts[5];
        if (parts[6]) fields.country = parts[6];
        break;
      }
      case 'NOTE': fields.note = val; break;
    }
  }
  return fields;
}

function unescapeVcardValue(val: string): string {
  return val
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Parse a vCard string back to a human-readable display (key: value format). */
export function parseVcard(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('BEGIN:VCARD')) return 'Error: Not a valid vCard (missing BEGIN:VCARD)';

  const unfolded = trimmed.replace(/\r?\n[ \t]/g, '');
  const result: string[] = [];

  for (const line of unfolded.split(/\r?\n/)) {
    if (line === 'BEGIN:VCARD' || line === 'END:VCARD') continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propName = line.slice(0, colonIdx).split(';')[0].toUpperCase();
    const unescapedVal = unescapeVcardValue(line.slice(colonIdx + 1).trim());

    switch (propName) {
      case 'VERSION': result.push('version: ' + unescapedVal); break;
      case 'FN': result.push('name: ' + unescapedVal); break;
      case 'N': {
        const parts = unescapedVal.split(';');
        const fullName = [parts[1], parts[0]].filter(Boolean).join(' ');
        if (fullName) result.push('full name: ' + fullName);
        break;
      }
      case 'ORG': result.push('org: ' + unescapedVal); break;
      case 'TITLE': result.push('title: ' + unescapedVal); break;
      case 'EMAIL': result.push('email: ' + unescapedVal); break;
      case 'TEL': result.push('phone: ' + unescapedVal); break;
      case 'URL': result.push('url: ' + unescapedVal); break;
      case 'ADR': {
        const parts = unescapedVal.split(';').map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) result.push('address: ' + parts.join(', '));
        break;
      }
      case 'NOTE': result.push('note: ' + unescapedVal); break;
      case 'REV': result.push('last modified: ' + unescapedVal); break;
      default:
        if (unescapedVal) result.push(propName.toLowerCase() + ': ' + unescapedVal);
    }
  }

  return result.join('\n');
}

/** Auto-detect whether input looks like a vCard or key=value input. */
export function detectVcardOrInput(input: string): 'vcard' | 'input' {
  return input.trim().startsWith('BEGIN:VCARD') ? 'vcard' : 'input';
}
