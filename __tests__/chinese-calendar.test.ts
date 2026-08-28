import {
  getZodiacAnimal,
  getElement,
  getCNYDate,
  getChineseCalendarInfo,
  formatChineseCalendar,
  getHeavenlyStem,
  getEarthlyBranch,
  getChineseYearReport,
  getChineseYearForDate,
  getCyclePosition,
  getLunarYearLength,
  getPolarity,
  hasCNYDate,
  isLeapLunarYear,
  parseYearInput,
  weekdayOf,
  formatLongDate,
  daysBetween,
  STEM_TABLE,
  BRANCH_TABLE,
  MIN_YEAR,
  MAX_YEAR,
} from '@/Components/Functions/ChineseCalendarTools/logic';

describe('getZodiacAnimal', () => {
  it('returns Rat for 2020', () => {
    // 2020 Chinese New Year is Year of the Rat
    expect(getZodiacAnimal(2020)).toBe('Rat');
  });
  it('returns Ox for 2021', () => {
    expect(getZodiacAnimal(2021)).toBe('Ox');
  });
  it('returns Dragon for 2024', () => {
    expect(getZodiacAnimal(2024)).toBe('Dragon');
  });
  it('cycles through 12 animals', () => {
    const animals = new Set<string>();
    for (let i = 0; i < 12; i++) {
      animals.add(getZodiacAnimal(2020 + i));
    }
    expect(animals.size).toBe(12);
  });
});

describe('getElement', () => {
  it('returns Metal for 2020', () => {
    // 2020 is year of the Metal Rat
    expect(getElement(2020)).toBe('Metal');
  });
  it('returns Wood for 2024', () => {
    // 2024 is year of the Wood Dragon
    expect(getElement(2024)).toBe('Wood');
  });
  it('cycles through 5 elements', () => {
    const elements = new Set<string>();
    for (let i = 0; i < 10; i++) {
      elements.add(getElement(2020 + i));
    }
    expect(elements.size).toBe(5);
  });
});

describe('getCNYDate', () => {
  it('returns correct date for 2024', () => {
    expect(getCNYDate(2024)).toBe('2024-02-10');
  });
  it('returns correct date for 2023', () => {
    expect(getCNYDate(2023)).toBe('2023-01-22');
  });
  it('handles years not in lookup table with fallback', () => {
    // Year 1899 not in table — should not throw
    const result = getCNYDate(1899);
    expect(result).toContain('1899');
  });
});

// ─── The date table itself ───────────────────────────────────────────────────

describe('CNY_DATES coverage', () => {
  it('covers every year from 1900 to 2100 with real data', () => {
    for (let y = MIN_YEAR; y <= 2100; y++) {
      expect(hasCNYDate(y)).toBe(true);
    }
  });

  it('has no fabricated fallback inside the supported range', () => {
    // The old table started at 2000, so 1900-1999 silently returned "Feb 5".
    const febFifths = [];
    for (let y = 1900; y < 2000; y++) {
      if (getCNYDate(y).endsWith('-02-05')) febFifths.push(y);
    }
    // A few genuinely are 5 February; a run of 100 would mean the fallback.
    expect(febFifths.length).toBeLessThan(10);
  });

  it('places every new year between 21 January and 21 February', () => {
    for (let y = MIN_YEAR; y <= 2100; y++) {
      const [, mm, dd] = getCNYDate(y).split('-').map(Number);
      const dayOfYear = mm === 1 ? dd : 31 + dd;
      expect(dayOfYear).toBeGreaterThanOrEqual(21);
      expect(dayOfYear).toBeLessThanOrEqual(52); // 31 + 21
    }
  });

  it('separates consecutive new years by a valid lunar year', () => {
    // 12 lunar months is 353-355 days, 13 months (a leap year) is 383-385.
    for (let y = MIN_YEAR; y < 2100; y++) {
      const len = getLunarYearLength(y);
      const valid = (len >= 353 && len <= 355) || (len >= 383 && len <= 385);
      expect(valid).toBe(true);
    }
  });

  it('matches well-documented historical dates', () => {
    expect(getCNYDate(1900)).toBe('1900-01-31');
    expect(getCNYDate(1912)).toBe('1912-02-18');
    expect(getCNYDate(1949)).toBe('1949-01-29');
    expect(getCNYDate(1976)).toBe('1976-01-31');
    expect(getCNYDate(1984)).toBe('1984-02-02');
    expect(getCNYDate(1988)).toBe('1988-02-17');
    expect(getCNYDate(1997)).toBe('1997-02-07');
  });
});

describe('getChineseCalendarInfo', () => {
  it('returns info for 2024', () => {
    const info = getChineseCalendarInfo(2024);
    expect(info.gregorianYear).toBe(2024);
    expect(info.chineseNewYear).toBe('2024-02-10');
    expect(info.zodiacAnimal).toBe('Dragon');
    expect(info.nextNewYear).toBe('2025-01-29');
  });
  it('throws for out-of-range year', () => {
    expect(() => getChineseCalendarInfo(1800)).toThrow();
    expect(() => getChineseCalendarInfo(2200)).toThrow();
  });
  it('returns next animal for 2024 (Snake)', () => {
    const info = getChineseCalendarInfo(2024);
    expect(info.nextAnimal).toBe('Snake');
  });
});

// ─── Stems, branches and the 60-year cycle ───────────────────────────────────

describe('stems and branches', () => {
  it('names 2020 as Geng-Zi', () => {
    expect(getHeavenlyStem(2020)).toBe('Geng');
    expect(getEarthlyBranch(2020)).toBe('Zi');
  });

  it('names 2024 as Jia-Chen', () => {
    expect(getHeavenlyStem(2024)).toBe('Jia');
    expect(getEarthlyBranch(2024)).toBe('Chen');
  });

  it('derives the same element from the stem as the year formula does', () => {
    // Two independent routes to the element — they must not drift apart.
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const fromStem = STEM_TABLE.find(s => s.name === getHeavenlyStem(y))!.element;
      expect(fromStem).toBe(getElement(y));
    }
  });

  it('derives the same animal from the branch as the year formula does', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const fromBranch = BRANCH_TABLE.find(b => b.name === getEarthlyBranch(y))!.animal;
      expect(fromBranch).toBe(getZodiacAnimal(y));
    }
  });

  it('alternates yang and yin by year', () => {
    expect(getPolarity(2024)).toBe('Yang');
    expect(getPolarity(2025)).toBe('Yin');
  });

  it('pairs a stem with a branch of matching polarity', () => {
    // Yang stems only ever meet yang branches — that is why 60 pairs exist, not 120.
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const stem = STEM_TABLE.find(s => s.name === getHeavenlyStem(y))!;
      const branch = BRANCH_TABLE.find(b => b.name === getEarthlyBranch(y))!;
      expect(stem.polarity).toBe(branch.polarity);
    }
  });

  it('numbers 1984 as position 1 of the cycle', () => {
    // 1984 is Jia-Zi, the start of the current sexagenary cycle.
    expect(getCyclePosition(1984)).toBe(1);
    expect(getCyclePosition(2043)).toBe(60);
  });

  it('repeats the stem-branch pair exactly every 60 years', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR - 60; y++) {
      expect(getHeavenlyStem(y + 60)).toBe(getHeavenlyStem(y));
      expect(getEarthlyBranch(y + 60)).toBe(getEarthlyBranch(y));
    }
    // ...and not sooner.
    expect(getCyclePosition(2024)).not.toBe(getCyclePosition(2024 + 30));
  });

  it('gives all 60 distinct pairs across a full cycle', () => {
    const pairs = new Set<string>();
    for (let y = 1984; y < 1984 + 60; y++) {
      pairs.add(`${getHeavenlyStem(y)}-${getEarthlyBranch(y)}`);
    }
    expect(pairs.size).toBe(60);
  });
});

// ─── Leap years and dates ────────────────────────────────────────────────────

describe('lunar year length', () => {
  it('reports 2023 as a leap year', () => {
    // 2023-01-22 to 2024-02-10 is 384 days — a leap month is inserted.
    expect(getLunarYearLength(2023)).toBe(384);
    expect(isLeapLunarYear(2023)).toBe(true);
  });

  it('reports 2024 as a common year', () => {
    expect(isLeapLunarYear(2024)).toBe(false);
    expect(getLunarYearLength(2024)).toBe(354);
  });

  it('makes roughly 7 leap years in every 19', () => {
    // The Metonic cycle: 7 intercalary months per 19 years.
    let leaps = 0;
    for (let y = 2000; y < 2019; y++) if (isLeapLunarYear(y)) leaps++;
    expect(leaps).toBe(7);
  });
});

describe('date helpers', () => {
  it('counts days between two dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30);
    expect(daysBetween('2024-02-10', '2025-01-29')).toBe(354);
  });

  it('names the weekday of a date', () => {
    expect(weekdayOf('2024-02-10')).toBe('Saturday');
    expect(weekdayOf('2025-01-29')).toBe('Wednesday');
  });

  it('formats a date for reading', () => {
    expect(formatLongDate('2024-02-10')).toBe('10 February 2024');
  });
});

describe('getChineseYearForDate', () => {
  it('assigns a date after new year to that year', () => {
    expect(getChineseYearForDate('2024-06-01')).toBe(2024);
  });

  it('assigns a date before new year to the previous year', () => {
    // 1 February 2024 is still the Rabbit year of 2023 — the Dragon starts on 10 Feb.
    expect(getChineseYearForDate('2024-02-01')).toBe(2023);
    expect(getZodiacAnimal(getChineseYearForDate('2024-02-01'))).toBe('Rabbit');
  });

  it('treats new year itself as the first day of the new year', () => {
    expect(getChineseYearForDate('2024-02-10')).toBe(2024);
    expect(getChineseYearForDate('2024-02-09')).toBe(2023);
  });

  it('assigns every 1 January to the previous Chinese year', () => {
    // New year never falls on 1 January, so this holds for the whole range.
    for (let y = MIN_YEAR + 1; y <= MAX_YEAR; y++) {
      expect(getChineseYearForDate(`${y}-01-01`)).toBe(y - 1);
    }
  });
});

// ─── The report the UI renders ───────────────────────────────────────────────

describe('getChineseYearReport', () => {
  it('describes 2024 as the Wood Dragon', () => {
    const r = getChineseYearReport(2024);
    expect(r.zodiacAnimal).toBe('Dragon');
    expect(r.element).toBe('Wood');
    expect(r.lunarYearName).toBe('Jia-Chen');
    expect(r.hanziPair).toBe('甲辰');
    expect(r.animalHanzi).toBe('龍');
    expect(r.polarity).toBe('Yang');
    expect(r.cyclePosition).toBe(41);
  });

  it('ends the year on the day before the next new year', () => {
    const r = getChineseYearReport(2024);
    expect(r.nextNewYear).toBe('2025-01-29');
    expect(r.yearEnds).toBe('2025-01-28');
  });

  it('lists same-animal years 12 apart', () => {
    const r = getChineseYearReport(2024);
    expect(r.sameAnimalYears).toContain(2012);
    expect(r.sameAnimalYears).toContain(2036);
    r.sameAnimalYears.forEach(y => expect(getZodiacAnimal(y)).toBe('Dragon'));
  });

  it('lists same-cycle years 60 apart', () => {
    const r = getChineseYearReport(2024);
    expect(r.sameCycleYears).toEqual([1964, 2024, 2084]);
  });

  it('clamps suggestion lists to the supported range', () => {
    const r = getChineseYearReport(MIN_YEAR);
    r.sameAnimalYears.forEach(y => {
      expect(y).toBeGreaterThanOrEqual(MIN_YEAR);
      expect(y).toBeLessThanOrEqual(MAX_YEAR);
    });
    expect(r.sameCycleYears).toEqual([1900, 1960]);
  });

  it('works for every year in range', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      expect(() => getChineseYearReport(y)).not.toThrow();
    }
  });

  it('rejects years outside the range it has data for', () => {
    expect(() => getChineseYearReport(MIN_YEAR - 1)).toThrow();
    // 2100 is in the date table, but its *end* would need 2101 — which is not.
    expect(() => getChineseYearReport(2100)).toThrow();
  });
});

describe('parseYearInput', () => {
  it('accepts a plain year', () => {
    expect(parseYearInput('2024')).toBe(2024);
    expect(parseYearInput('  1984  ')).toBe(1984);
  });
  it('rejects empty input', () => {
    expect(() => parseYearInput('')).toThrow('Enter a year');
  });
  it('rejects non-numeric input', () => {
    expect(() => parseYearInput('abc')).toThrow();
    // parseInt would have accepted these; the regex must not.
    expect(() => parseYearInput('2024abc')).toThrow();
    expect(() => parseYearInput('20.24')).toThrow();
  });
  it('rejects out-of-range years', () => {
    expect(() => parseYearInput('1899')).toThrow();
    expect(() => parseYearInput('2100')).toThrow();
  });
});

describe('formatChineseCalendar', () => {
  it('returns empty string for empty input', () => {
    expect(formatChineseCalendar('')).toBe('');
  });
  it('includes zodiac animal in output', () => {
    const result = formatChineseCalendar('2024');
    expect(result).toContain('Dragon');
  });
  it('includes Chinese New Year date', () => {
    const result = formatChineseCalendar('2024');
    expect(result).toContain('2024-02-10');
  });
  it('throws on invalid input', () => {
    expect(() => formatChineseCalendar('abc')).toThrow();
  });
});
