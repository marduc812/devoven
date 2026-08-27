export function propertiesToJson(input: string): string {
  const obj: Record<string, string> = {};
  const lines = input.split('\n');

  let currentKey = '';
  let currentVal = '';
  let continuation = false;

  for (const line of lines) {
    if (continuation) {
      const trimmed = line.trimStart();
      if (trimmed.endsWith('\\')) {
        currentVal += trimmed.slice(0, -1);
      } else {
        currentVal += trimmed;
        obj[currentKey] = unescapeProperties(currentVal);
        currentKey = '';
        currentVal = '';
        continuation = false;
      }
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

    // Find separator: = or : or whitespace
    const sepMatch = trimmed.match(/^([^=:!\s]+)\s*[=:]\s*(.*)$/);
    if (!sepMatch) continue;

    const key = sepMatch[1];
    let val = sepMatch[2];

    if (val.endsWith('\\')) {
      currentKey = key;
      currentVal = val.slice(0, -1);
      continuation = true;
    } else {
      obj[key] = unescapeProperties(val);
    }
  }

  return JSON.stringify(obj, null, 2);
}

function unescapeProperties(val: string): string {
  return val
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\!/g, '!')
    .replace(/\\#/g, '#')
    .replace(/\\\\/g, '\\');
}

export function jsonToProperties(input: string): string {
  const obj = JSON.parse(input) as Record<string, unknown>;
  return Object.entries(obj)
    .map(([k, v]) => {
      const val = String(v)
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/!/g, '\\!')
        .replace(/#/g, '\\#');
      return `${k}=${val}`;
    })
    .join('\n');
}
