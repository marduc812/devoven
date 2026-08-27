import {
  parseDuration,
  breakdown,
  combineDurations,
  formatBreakdown,
} from '@/Components/Functions/TimeDurationCalcTools/logic';

describe('parseDuration', () => {
  it('parses HH:MM:SS', () => {
    expect(parseDuration('1:30:00')).toBe(5400);
  });

  it('parses MM:SS', () => {
    expect(parseDuration('1:30')).toBe(90);
  });

  it('parses short unit notation', () => {
    expect(parseDuration('2h 30m')).toBe(9000);
    expect(parseDuration('1d')).toBe(86400);
    expect(parseDuration('45s')).toBe(45);
  });

  it('parses long unit names', () => {
    expect(parseDuration('90 minutes')).toBe(5400);
    expect(parseDuration('2 hours')).toBe(7200);
    expect(parseDuration('3 days')).toBe(259200);
    expect(parseDuration('1 week')).toBe(604800);
  });

  it('parses plain seconds', () => {
    expect(parseDuration('3600')).toBe(3600);
  });

  it('throws for invalid input', () => {
    expect(() => parseDuration('abc')).toThrow();
    expect(() => parseDuration('')).toThrow();
  });

  it('parses combined durations', () => {
    expect(parseDuration('1d 4h 30m 15s')).toBe(86400 + 14400 + 1800 + 15);
  });
});

describe('breakdown', () => {
  it('breaks down 90 seconds correctly', () => {
    const b = breakdown(90);
    expect(b.minutes).toBe(1);
    expect(b.seconds).toBe(30);
    expect(b.hours).toBe(0);
    expect(b.totalSeconds).toBe(90);
  });

  it('breaks down 1 week correctly', () => {
    const b = breakdown(604800);
    expect(b.weeks).toBe(1);
    expect(b.days).toBe(0);
    expect(b.hours).toBe(0);
  });

  it('formats HH:MM:SS correctly for 2h 30m', () => {
    const b = breakdown(9000);
    expect(b.hms).toBe('2:30:00');
  });

  it('throws for negative seconds', () => {
    expect(() => breakdown(-1)).toThrow();
  });

  it('human-readable includes minutes and seconds for 90s', () => {
    const b = breakdown(90);
    expect(b.human).toContain('minute');
    expect(b.human).toContain('second');
  });
});

describe('combineDurations', () => {
  it('adds two durations', () => {
    expect(combineDurations('1h', '30m', 'add')).toBe(5400);
  });

  it('subtracts two durations', () => {
    expect(combineDurations('2h', '30m', 'subtract')).toBe(5400);
  });

  it('throws when subtraction result is negative', () => {
    expect(() => combineDurations('30m', '2h', 'subtract')).toThrow();
  });
});

describe('formatBreakdown', () => {
  it('includes all unit sections', () => {
    const b = breakdown(9000);
    const output = formatBreakdown(b);
    expect(output).toContain('Total seconds');
    expect(output).toContain('Total minutes');
    expect(output).toContain('Total hours');
    expect(output).toContain('Components');
    expect(output).toContain('HH:MM:SS');
  });
});
