export type WhoisData = {
  [key: string]: string;
};

export function parseWhois(input: string): WhoisData {
  const result: WhoisData = {};
  const lines = input.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('%') || line.trim().startsWith('#') || !line.trim()) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key && val) {
      // Keep first occurrence of each key
      if (!result[key]) result[key] = val;
    }
  }

  return result;
}

const IMPORTANT_FIELDS = [
  'Domain Name', 'Registrar', 'Creation Date', 'Updated Date', 'Registry Expiry Date',
  'Registrant Organization', 'Registrant Country', 'Name Server',
  'DNSSEC', 'Domain Status',
];

export function formatWhoisSummary(data: WhoisData): string {
  const important: string[] = [];
  const other: string[] = [];

  for (const [key, val] of Object.entries(data)) {
    const line = `${key}: ${val}`;
    if (IMPORTANT_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      important.push(line);
    } else {
      other.push(line);
    }
  }

  return [
    '=== Key Information ===',
    ...important,
    '',
    '=== All Fields ===',
    ...other,
  ].join('\n');
}
