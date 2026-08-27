// Cron Expression Parser — pure TypeScript, no browser APIs

export type CronField = {
  raw: string;
  name: string;
  description: string;
  valid: boolean;
  error?: string;
};

export type CronParseResult = {
  valid: boolean;
  expression: string;
  fields: CronField[];
  humanReadable: string;
  nextRuns: string[];
  error?: string;
};

// ─── Field metadata ───────────────────────────────────────────────────────────

const FIELD_NAMES = ['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'];
const FIELD_NAMES_6 = ['Second', 'Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function replaceMonthNames(s: string): string {
  let r = s;
  MONTH_NAMES.forEach((m, i) => {
    r = r.replace(new RegExp(m, 'gi'), String(i + 1));
  });
  return r;
}

function replaceDowNames(s: string): string {
  let r = s;
  DOW_NAMES.forEach((d, i) => {
    r = r.replace(new RegExp(d, 'gi'), String(i));
  });
  return r;
}

// ─── Field validation ─────────────────────────────────────────────────────────

function validateField(raw: string, min: number, max: number, name: string): CronField {
  const s = raw.trim();

  if (s === '*') {
    return { raw, name, description: `Every ${name.toLowerCase()}`, valid: true };
  }

  // */step
  const stepAllMatch = s.match(/^\*\/(\d+)$/);
  if (stepAllMatch) {
    const step = parseInt(stepAllMatch[1], 10);
    if (step < 1 || step > max) {
      return { raw, name, description: '', valid: false, error: `Step ${step} out of range` };
    }
    return { raw, name, description: `Every ${step} ${name.toLowerCase()}(s)`, valid: true };
  }

  // Comma-separated list of values/ranges
  const parts = s.split(',');
  const descs: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    // range: a-b or a-b/step
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      const step = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : 1;
      if (a < min || b > max || a > b) {
        return { raw, name, description: '', valid: false, error: `Range ${a}-${b} out of bounds [${min}-${max}]` };
      }
      descs.push(step === 1 ? `${a} to ${b}` : `${a} to ${b} every ${step}`);
      continue;
    }
    // single value
    const valMatch = trimmed.match(/^(\d+)$/);
    if (valMatch) {
      const v = parseInt(valMatch[1], 10);
      if (v < min || v > max) {
        return { raw, name, description: '', valid: false, error: `Value ${v} out of range [${min}-${max}]` };
      }
      descs.push(String(v));
      continue;
    }
    return { raw, name, description: '', valid: false, error: `Cannot parse part: ${trimmed}` };
  }

  const joined = descs.join(', ');
  return { raw, name, description: `${name}: ${joined}`, valid: true };
}

// ─── Human-readable summary ───────────────────────────────────────────────────

function humanReadable(fields: CronField[], is6: boolean): string {
  const idxMinute = is6 ? 1 : 0;
  const idxHour = is6 ? 2 : 1;
  const idxDom = is6 ? 3 : 2;
  const idxMonth = is6 ? 4 : 3;
  const idxDow = is6 ? 5 : 4;

  const minute = fields[idxMinute].raw;
  const hour = fields[idxHour].raw;
  const dom = fields[idxDom].raw;
  const month = fields[idxMonth].raw;
  const dow = fields[idxDow].raw;

  let time = '';
  if (minute === '0' && hour === '0') {
    time = 'at midnight';
  } else if (minute === '0' && hour !== '*') {
    time = `at ${hour}:00`;
  } else if (minute !== '*' && hour !== '*') {
    time = `at ${hour}:${minute.length === 1 ? '0' + minute : minute}`;
  } else if (hour === '*' && minute === '*') {
    time = 'every minute';
  } else if (hour === '*' && minute !== '*') {
    time = `at minute ${minute} of every hour`;
  } else {
    time = `at minute ${minute}`;
  }

  let dayPart = '';
  if (dom !== '*' && dow !== '*') {
    dayPart = `, on day ${dom} of the month and on ${dow}`;
  } else if (dom !== '*') {
    dayPart = `, on day ${dom} of the month`;
  } else if (dow !== '*') {
    const dowNames: Record<string, string> = { '0':'Sunday','1':'Monday','2':'Tuesday','3':'Wednesday','4':'Thursday','5':'Friday','6':'Saturday','7':'Sunday' };
    dayPart = `, on ${dowNames[dow] || 'day ' + dow}`;
  } else {
    dayPart = ', every day';
  }

  let monthPart = '';
  if (month !== '*') {
    const monthNames: Record<string, string> = { '1':'January','2':'February','3':'March','4':'April','5':'May','6':'June','7':'July','8':'August','9':'September','10':'October','11':'November','12':'December' };
    monthPart = ` in ${monthNames[month] || 'month ' + month}`;
  }

  const secondPart = is6 && fields[0].raw !== '*' && fields[0].raw !== '0'
    ? ` (second: ${fields[0].raw})` : '';

  return `Runs ${time}${dayPart}${monthPart}${secondPart}.`;
}

// ─── Next run time computation ────────────────────────────────────────────────

function parseParts(raw: string, min: number, max: number): number[] | null {
  const s = raw.trim();
  if (s === '*') return null; // means "any"

  const all: number[] = [];

  const stepAllMatch = s.match(/^\*\/(\d+)$/);
  if (stepAllMatch) {
    const step = parseInt(stepAllMatch[1], 10);
    for (let i = min; i <= max; i += step) all.push(i);
    return all;
  }

  const parts = s.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      const step = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : 1;
      for (let i = a; i <= b; i += step) all.push(i);
      continue;
    }
    const valMatch = trimmed.match(/^(\d+)$/);
    if (valMatch) {
      all.push(parseInt(valMatch[1], 10));
      continue;
    }
    return [];
  }
  return all.sort((a, b) => a - b);
}

function matchesField(value: number, parts: number[] | null): boolean {
  if (parts === null) return true;
  return parts.indexOf(value) !== -1;
}

function computeNextRuns(expression: string, count: number): string[] {
  const parts = expression.trim().split(/\s+/);
  const is6 = parts.length === 6;

  const secRaw = is6 ? parts[0] : '0';
  const minRaw = is6 ? parts[1] : parts[0];
  const hourRaw = is6 ? parts[2] : parts[1];
  const domRaw = is6 ? parts[3] : parts[2];
  const monRaw = is6 ? parts[4] : parts[3];
  const dowRaw = is6 ? parts[5] : parts[4];

  const secParts = parseParts(secRaw, 0, 59);
  const minParts = parseParts(minRaw, 0, 59);
  const hourParts = parseParts(hourRaw, 0, 23);
  const domParts = parseParts(domRaw, 1, 31);
  const monParts = parseParts(replaceMonthNames(monRaw), 1, 12);
  const dowParts = parseParts(replaceDowNames(dowRaw), 0, 7);

  const results: string[] = [];
  // Start from now + 1 second
  const start = new Date();
  start.setMilliseconds(0);
  start.setSeconds(start.getSeconds() + 1);

  let current = new Date(start.getTime());
  const maxIterations = 366 * 24 * 60 * 60; // cap at 1 year of seconds
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    const sec = current.getUTCSeconds();
    const min = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const dom = current.getUTCDate();
    const mon = current.getUTCMonth() + 1; // 1-12
    const dow = current.getUTCDay(); // 0=Sun

    // Month check — advance to next month if not matching
    if (!matchesField(mon, monParts)) {
      // skip to first day of next month
      current.setUTCMonth(current.getUTCMonth() + 1, 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Day check (dom OR dow when both specified, AND when only one specified)
    const domOk = domParts === null || domParts.indexOf(dom) !== -1;
    // normalize dow: 7 -> 0
    const normalizedDow = dow % 7;
    const dowOk = dowParts === null || dowParts.indexOf(normalizedDow) !== -1 || dowParts.indexOf(dow) !== -1;

    const dayOk = (domRaw === '*' && dowRaw === '*')
      ? true
      : (domRaw !== '*' && dowRaw !== '*')
        ? (domOk || dowOk)
        : (domOk && dowOk);

    if (!dayOk) {
      current.setUTCDate(current.getUTCDate() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Hour check
    if (!matchesField(hour, hourParts)) {
      current.setUTCHours(current.getUTCHours() + 1, 0, 0, 0);
      continue;
    }

    // Minute check
    if (!matchesField(min, minParts)) {
      current.setUTCMinutes(current.getUTCMinutes() + 1, 0, 0);
      continue;
    }

    // Second check
    if (!matchesField(sec, secParts)) {
      current.setUTCSeconds(current.getUTCSeconds() + 1, 0);
      continue;
    }

    // We have a match
    results.push(formatDate(current));
    current.setUTCSeconds(current.getUTCSeconds() + 1, 0);
  }

  return results;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).length === 1 ? '0' + String(n) : String(n);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC (${days[d.getUTCDay()]})`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseCronExpression(expression: string): CronParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { valid: false, expression: trimmed, fields: [], humanReadable: '', nextRuns: [], error: 'Empty expression' };
  }

  // Handle special strings
  const specials: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
  };

  const resolved = specials[trimmed.toLowerCase()] || trimmed;
  const parts = resolved.split(/\s+/);

  if (parts.length !== 5 && parts.length !== 6) {
    return {
      valid: false,
      expression: trimmed,
      fields: [],
      humanReadable: '',
      nextRuns: [],
      error: `Expected 5 or 6 fields, got ${parts.length}`,
    };
  }

  const is6 = parts.length === 6;
  const fieldNames = is6 ? FIELD_NAMES_6 : FIELD_NAMES;
  const fieldBounds = is6
    ? [[0,59],[0,59],[0,23],[1,31],[1,12],[0,7]]
    : [[0,59],[0,23],[1,31],[1,12],[0,7]];

  const normalizedParts = parts.map((p, i) => {
    if (i === (is6 ? 4 : 3)) return replaceMonthNames(p);
    if (i === (is6 ? 5 : 4)) return replaceDowNames(p);
    return p;
  });

  const fields: CronField[] = normalizedParts.map((p, i) =>
    validateField(p, fieldBounds[i][0], fieldBounds[i][1], fieldNames[i])
  );

  const allValid = fields.every(f => f.valid);
  if (!allValid) {
    const firstError = fields.find(f => !f.valid);
    return {
      valid: false,
      expression: trimmed,
      fields,
      humanReadable: '',
      nextRuns: [],
      error: firstError ? firstError.error : 'Invalid expression',
    };
  }

  let nextRuns: string[] = [];
  try {
    nextRuns = computeNextRuns(resolved, 5);
  } catch (_e) {
    nextRuns = [];
  }

  return {
    valid: true,
    expression: trimmed,
    fields,
    humanReadable: humanReadable(fields, is6),
    nextRuns,
  };
}
