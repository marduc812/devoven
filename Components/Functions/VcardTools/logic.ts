// Pure TypeScript — no browser APIs.

export interface VcardFields {
  name?: string;
  email?: string;
  phone?: string;
  org?: string;
  title?: string;
  url?: string;
  address?: string;
  note?: string;
  [key: string]: string | undefined;
}

/**
 * Parse key=value lines into a VcardFields object.
 * Supports both `key=value` and `key: value` formats.
 */
export function parseKeyValueInput(input: string): VcardFields {
  const fields: VcardFields = {};
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
 * Fold long vCard lines at 75 chars per RFC 6350.
 */
function foldLine(line: string): string {
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

function escapeVcardValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a vCard 3.0 (.vcf) from structured input (key=value lines).
 */
export function generateVcard(input: string): string {
  if (!input.trim()) return '';

  const fields = parseKeyValueInput(input);
  const lines: string[] = [];

  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  // Full name / structured name
  const name = fields['name'] || fields['fn'] || '';
  if (name) {
    lines.push(foldLine('FN:' + escapeVcardValue(name)));
    // Build N: (Family;Given;Additional;Prefix;Suffix)
    const parts = name.split(/\s+/);
    const family = parts.length > 1 ? parts[parts.length - 1] : name;
    const given = parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : '';
    lines.push(foldLine('N:' + escapeVcardValue(family) + ';' + escapeVcardValue(given) + ';;;'));
  } else {
    lines.push('FN:');
    lines.push('N:;;;;');
  }

  if (fields['org']) {
    lines.push(foldLine('ORG:' + escapeVcardValue(fields['org'])));
  }

  if (fields['title']) {
    lines.push(foldLine('TITLE:' + escapeVcardValue(fields['title'])));
  }

  if (fields['email']) {
    const emails = fields['email'].split(/[;,]/).map(e => e.trim()).filter(Boolean);
    for (const email of emails) {
      lines.push(foldLine('EMAIL;TYPE=INTERNET:' + email));
    }
  }

  if (fields['phone'] || fields['tel']) {
    const phones = (fields['phone'] || fields['tel'] || '').split(/[;,]/).map(p => p.trim()).filter(Boolean);
    for (const phone of phones) {
      lines.push(foldLine('TEL;TYPE=VOICE:' + phone));
    }
  }

  if (fields['url'] || fields['website']) {
    lines.push(foldLine('URL:' + (fields['url'] || fields['website'] || '')));
  }

  if (fields['address'] || fields['adr']) {
    // ADR format: po-box;ext-address;street;city;state;postal;country
    lines.push(foldLine('ADR;TYPE=HOME:;;' + escapeVcardValue(fields['address'] || fields['adr'] || '') + ';;;;'));
  }

  if (fields['note']) {
    lines.push(foldLine('NOTE:' + escapeVcardValue(fields['note'])));
  }

  const now = new Date();
  const rev = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
  lines.push('REV:' + rev);

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Parse a vCard string back to a human-readable display (key: value format).
 */
export function parseVcard(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('BEGIN:VCARD')) return 'Error: Not a valid vCard (missing BEGIN:VCARD)';

  // Unfold lines (lines starting with space/tab are continuation)
  const unfolded = trimmed.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const result: string[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VCARD' || line === 'END:VCARD') continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propFull = line.slice(0, colonIdx);
    const val = line.slice(colonIdx + 1).trim();

    // Strip parameters (TYPE=..., etc.)
    const propName = propFull.split(';')[0].toUpperCase();

    const unescapedVal = val
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');

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

/**
 * Auto-detect whether input looks like a vCard or key=value input.
 */
export function detectVcardOrInput(input: string): 'vcard' | 'input' {
  const trimmed = input.trim();
  if (trimmed.startsWith('BEGIN:VCARD')) return 'vcard';
  return 'input';
}
