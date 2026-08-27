export type CronParts = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export function cronToString(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
}

export function parseCron(expr: string): CronParts {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('Cron expression must have 5 parts');
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

export function validateCronPart(value: string, min: number, max: number): boolean {
  if (value === '*') return true;
  if (/^\*\/\d+$/.test(value)) {
    const step = parseInt(value.slice(2));
    return step >= 1 && step <= max;
  }
  if (/^\d+$/.test(value)) {
    const n = parseInt(value);
    return n >= min && n <= max;
  }
  if (/^\d+-\d+$/.test(value)) {
    const [a, b] = value.split('-').map(Number);
    return a >= min && b <= max && a <= b;
  }
  // Comma-separated list
  if (/^[\d,]+$/.test(value)) {
    return value.split(',').every(v => {
      const n = parseInt(v);
      return !isNaN(n) && n >= min && n <= max;
    });
  }
  return false;
}

export function validateCron(parts: CronParts): string[] {
  const errors: string[] = [];
  if (!validateCronPart(parts.minute, 0, 59)) errors.push('Invalid minute (0-59)');
  if (!validateCronPart(parts.hour, 0, 23)) errors.push('Invalid hour (0-23)');
  if (!validateCronPart(parts.dayOfMonth, 1, 31))
    errors.push('Invalid day of month (1-31)');
  if (!validateCronPart(parts.month, 1, 12)) errors.push('Invalid month (1-12)');
  if (!validateCronPart(parts.dayOfWeek, 0, 7))
    errors.push('Invalid day of week (0-7)');
  return errors;
}

// Common presets
export const CRON_PRESETS: { label: string; cron: string }[] = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 30 minutes', cron: '*/30 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at midnight', cron: '0 0 * * *' },
  { label: 'Daily at noon', cron: '0 12 * * *' },
  { label: 'Every weekday at 9am', cron: '0 9 * * 1-5' },
  { label: 'Every Monday', cron: '0 0 * * 1' },
  { label: 'First of month', cron: '0 0 1 * *' },
  { label: 'Every Sunday midnight', cron: '0 0 * * 0' },
];
