import {
  resolveTimezone,
  findOverlap,
  parseTimezoneInput,
} from '@/Components/Functions/TimezoneOverlapTools/logic';

describe('resolveTimezone', () => {
  it('resolves UTC to offset 0', () => {
    const tz = resolveTimezone('UTC');
    expect(tz.offsetHours).toBe(0);
    expect(tz.name).toBe('UTC');
  });

  it('resolves EST to offset -5', () => {
    const tz = resolveTimezone('EST');
    expect(tz.offsetHours).toBe(-5);
  });

  it('resolves JST to offset +9', () => {
    const tz = resolveTimezone('JST');
    expect(tz.offsetHours).toBe(9);
  });

  it('resolves IST to offset +5.5', () => {
    const tz = resolveTimezone('IST');
    expect(tz.offsetHours).toBe(5.5);
  });

  it('resolves UTC+2 offset string', () => {
    const tz = resolveTimezone('UTC+2');
    expect(tz.offsetHours).toBe(2);
  });

  it('resolves -8 offset string', () => {
    const tz = resolveTimezone('-8');
    expect(tz.offsetHours).toBe(-8);
  });

  it('resolves UTC+5:30', () => {
    const tz = resolveTimezone('UTC+5:30');
    expect(tz.offsetHours).toBeCloseTo(5.5, 5);
  });

  it('throws for unknown timezone', () => {
    expect(() => resolveTimezone('XYZ')).toThrow();
  });
});

describe('parseTimezoneInput', () => {
  it('splits comma-separated zones', () => {
    expect(parseTimezoneInput('UTC, EST, JST')).toEqual(['UTC', 'EST', 'JST']);
  });

  it('trims whitespace', () => {
    expect(parseTimezoneInput('  UTC  ,  PST  ')).toEqual(['UTC', 'PST']);
  });

  it('filters empty strings', () => {
    expect(parseTimezoneInput('UTC,,PST')).toEqual(['UTC', 'PST']);
  });
});

describe('findOverlap', () => {
  it('throws for fewer than 2 zones', () => {
    expect(() => findOverlap(['UTC'])).toThrow();
  });

  it('throws for more than 4 zones', () => {
    expect(() => findOverlap(['UTC', 'EST', 'PST', 'JST', 'CET'])).toThrow();
  });

  it('returns 24 grid rows', () => {
    const r = findOverlap(['UTC', 'EST']);
    expect(r.grid).toHaveLength(24);
  });

  it('zones are resolved', () => {
    const r = findOverlap(['UTC', 'EST']);
    expect(r.zones).toHaveLength(2);
    expect(r.zones[0].name).toBe('UTC');
    expect(r.zones[1].name).toBe('EST');
  });

  it('working hours overlap with same zone is 8 hours (9-17)', () => {
    const r = findOverlap(['UTC', 'UTC']);
    expect(r.workingHoursOverlap).toHaveLength(8);
  });

  it('UTC and UTC+12 have no overlap', () => {
    // UTC business hours 9-17, UTC+12 local = UTC-12 for reverse, overlap unlikely
    const r = findOverlap(['UTC', '+12']);
    // UTC working: 9-17. For +12 zone, UTC 9 = local 21, UTC 17 = local 5.
    // No overlap expected
    expect(r.workingHoursOverlap).toHaveLength(0);
  });

  it('meeting suggestions are sorted by score desc', () => {
    const r = findOverlap(['CET', 'GMT']);
    if (r.meetingSuggestions.length > 1) {
      expect(r.meetingSuggestions[0].score).toBeGreaterThanOrEqual(r.meetingSuggestions[1].score);
    }
  });
});
