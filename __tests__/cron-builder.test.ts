import {
  cronToString,
  parseCron,
  validateCronPart,
  validateCron,
  CRON_PRESETS,
  type CronParts,
} from '../Components/Functions/CronBuilderTools/logic';

// ─── cronToString ────────────────────────────────────────────────────────────

describe('cronToString', () => {
  it('builds cron string from parts', () => {
    const parts: CronParts = {
      minute: '0',
      hour: '12',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    expect(cronToString(parts)).toBe('0 12 * * *');
  });

  it('handles wildcard parts', () => {
    const parts: CronParts = {
      minute: '*',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    expect(cronToString(parts)).toBe('* * * * *');
  });

  it('handles step values', () => {
    const parts: CronParts = {
      minute: '*/5',
      hour: '*/6',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    expect(cronToString(parts)).toBe('*/5 */6 * * *');
  });
});

// ─── parseCron ────────────────────────────────────────────────────────────────

describe('parseCron', () => {
  it('parses standard cron expression', () => {
    const result = parseCron('0 12 * * *');
    expect(result).toEqual({
      minute: '0',
      hour: '12',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    });
  });

  it('parses complex expression', () => {
    const result = parseCron('*/5 0-23 1,15 * 1-5');
    expect(result.minute).toBe('*/5');
    expect(result.hour).toBe('0-23');
    expect(result.dayOfMonth).toBe('1,15');
    expect(result.dayOfWeek).toBe('1-5');
  });

  it('throws on expression with wrong number of parts', () => {
    expect(() => parseCron('* * *')).toThrow('Cron expression must have 5 parts');
  });

  it('throws on expression with 6 parts', () => {
    expect(() => parseCron('* * * * * *')).toThrow('Cron expression must have 5 parts');
  });
});

// ─── validateCronPart ────────────────────────────────────────────────────────

describe('validateCronPart', () => {
  it('validates wildcard *', () => {
    expect(validateCronPart('*', 0, 59)).toBe(true);
  });

  it('validates step */5', () => {
    expect(validateCronPart('*/5', 0, 59)).toBe(true);
  });

  it('validates numeric value in range', () => {
    expect(validateCronPart('30', 0, 59)).toBe(true);
  });

  it('rejects numeric value out of range', () => {
    expect(validateCronPart('60', 0, 59)).toBe(false);
  });

  it('validates range like 1-5', () => {
    expect(validateCronPart('1-5', 0, 7)).toBe(true);
  });

  it('rejects invalid range', () => {
    expect(validateCronPart('5-1', 0, 7)).toBe(false);
  });

  it('validates comma-separated list', () => {
    expect(validateCronPart('1,15,30', 0, 59)).toBe(true);
  });

  it('rejects invalid step 0', () => {
    expect(validateCronPart('*/0', 0, 59)).toBe(false);
  });

  it('rejects garbage input', () => {
    expect(validateCronPart('abc', 0, 59)).toBe(false);
  });
});

// ─── validateCron ────────────────────────────────────────────────────────────

describe('validateCron', () => {
  it('returns empty errors for valid cron', () => {
    const parts: CronParts = {
      minute: '0',
      hour: '12',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    expect(validateCron(parts)).toEqual([]);
  });

  it('returns error for invalid minute', () => {
    const parts: CronParts = {
      minute: '60',
      hour: '*',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    const errors = validateCron(parts);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('minute');
  });

  it('returns multiple errors', () => {
    const parts: CronParts = {
      minute: '99',
      hour: '99',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    };
    const errors = validateCron(parts);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── CRON_PRESETS ─────────────────────────────────────────────────────────────

describe('CRON_PRESETS', () => {
  it('has at least 10 presets', () => {
    expect(CRON_PRESETS.length).toBeGreaterThanOrEqual(10);
  });

  it('each preset has label and cron', () => {
    for (const preset of CRON_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.cron).toBeTruthy();
    }
  });

  it('all preset cron expressions are valid', () => {
    for (const preset of CRON_PRESETS) {
      const parts = parseCron(preset.cron);
      const errors = validateCron(parts);
      expect(errors).toEqual([]);
    }
  });
});
