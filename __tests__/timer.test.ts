import { formatDuration, parseDurationParam, splitMs, toMs } from '@/Components/Functions/TimerShared/duration';
import { buildLap, formatLap } from '@/Components/Functions/TimerTools/logic';

describe('formatDuration', () => {
  it('drops the hours field under an hour', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(5000)).toBe('00:05');
    expect(formatDuration(65000)).toBe('01:05');
    expect(formatDuration(3599000)).toBe('59:59');
  });

  it('includes hours from an hour up', () => {
    expect(formatDuration(3600000)).toBe('01:00:00');
    expect(formatDuration(3903000)).toBe('01:05:03');
  });

  it('clamps negative values to zero', () => {
    expect(formatDuration(-5000)).toBe('00:00');
  });

  it('truncates sub-second remainders rather than rounding up', () => {
    expect(formatDuration(4999)).toBe('00:04');
  });
});

describe('toMs / splitMs', () => {
  it('round-trips a duration', () => {
    const ms = toMs(1, 5, 3);
    expect(ms).toBe(3903000);
    expect(splitMs(ms)).toEqual({ hours: 1, minutes: 5, seconds: 3 });
  });

  it('clamps negative input when splitting', () => {
    expect(splitMs(-1000)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('parseDurationParam', () => {
  it('parses bare seconds', () => {
    expect(parseDurationParam('300')).toBe(300000);
  });

  it('parses unit notation', () => {
    expect(parseDurationParam('5m30s')).toBe(330000);
    expect(parseDurationParam('1h 5m')).toBe(3900000);
    expect(parseDurationParam('90S')).toBe(90000);
  });

  it('parses clock notation', () => {
    expect(parseDurationParam('1:30')).toBe(90000);
    expect(parseDurationParam('1:02:03')).toBe(3723000);
  });

  it('rejects unparseable and non-positive input', () => {
    expect(parseDurationParam('')).toBeNull();
    expect(parseDurationParam('abc')).toBeNull();
    expect(parseDurationParam('0')).toBeNull();
    expect(parseDurationParam('00:00')).toBeNull();
    expect(parseDurationParam('5m30x')).toBeNull();
    expect(parseDurationParam('1:2:3:4')).toBeNull();
    expect(parseDurationParam('-5')).toBeNull();
  });
});

describe('buildLap', () => {
  it('measures the first lap from zero', () => {
    expect(buildLap([], 5000)).toEqual({ index: 1, splitMs: 5000, totalMs: 5000 });
  });

  it('measures later laps from the previous total', () => {
    const first = buildLap([], 5000);
    const second = buildLap([first], 12000);
    expect(second).toEqual({ index: 2, splitMs: 7000, totalMs: 12000 });
  });

  it('formats a lap row', () => {
    expect(formatLap({ index: 2, splitMs: 7000, totalMs: 12000 })).toEqual({
      label: 'Lap 2',
      split: '00:07',
      total: '00:12',
    });
  });
});
