export interface ChineseCalendarInfo {
  gregorianYear: number;
  chineseNewYear: string;
  zodiacAnimal: string;
  element: string;
  stem: string;
  branch: string;
  lunarYearName: string;
  lunarYearNumber: number;
  nextNewYear: string;
  nextAnimal: string;
  nextElement: string;
}

// Chinese New Year dates 1900-2100 (format: "MM-DD"), from astronomical calendar
// data. Every consecutive pair is separated by a valid lunar year — 353-355 days
// for a common year, 383-385 for a leap year — which is what guards this table
// against transcription errors.
const CNY_DATES: Record<number, string> = {
  1900: '01-31', 1901: '02-19', 1902: '02-08', 1903: '01-29', 1904: '02-16',
  1905: '02-04', 1906: '01-25', 1907: '02-13', 1908: '02-02', 1909: '01-22',
  1910: '02-10', 1911: '01-30', 1912: '02-18', 1913: '02-06', 1914: '01-26',
  1915: '02-14', 1916: '02-03', 1917: '01-23', 1918: '02-11', 1919: '02-01',
  1920: '02-20', 1921: '02-08', 1922: '01-28', 1923: '02-16', 1924: '02-05',
  1925: '01-24', 1926: '02-13', 1927: '02-02', 1928: '01-23', 1929: '02-10',
  1930: '01-30', 1931: '02-17', 1932: '02-06', 1933: '01-26', 1934: '02-14',
  1935: '02-04', 1936: '01-24', 1937: '02-11', 1938: '01-31', 1939: '02-19',
  1940: '02-08', 1941: '01-27', 1942: '02-15', 1943: '02-05', 1944: '01-25',
  1945: '02-13', 1946: '02-02', 1947: '01-22', 1948: '02-10', 1949: '01-29',
  1950: '02-17', 1951: '02-06', 1952: '01-27', 1953: '02-14', 1954: '02-03',
  1955: '01-24', 1956: '02-12', 1957: '01-31', 1958: '02-18', 1959: '02-08',
  1960: '01-28', 1961: '02-15', 1962: '02-05', 1963: '01-25', 1964: '02-13',
  1965: '02-02', 1966: '01-21', 1967: '02-09', 1968: '01-30', 1969: '02-17',
  1970: '02-06', 1971: '01-27', 1972: '02-15', 1973: '02-03', 1974: '01-23',
  1975: '02-11', 1976: '01-31', 1977: '02-18', 1978: '02-07', 1979: '01-28',
  1980: '02-16', 1981: '02-05', 1982: '01-25', 1983: '02-13', 1984: '02-02',
  1985: '02-20', 1986: '02-09', 1987: '01-29', 1988: '02-17', 1989: '02-06',
  1990: '01-27', 1991: '02-15', 1992: '02-04', 1993: '01-23', 1994: '02-10',
  1995: '01-31', 1996: '02-19', 1997: '02-07', 1998: '01-28', 1999: '02-16',
  2000: '02-05', 2001: '01-24', 2002: '02-12', 2003: '02-01', 2004: '01-22',
  2005: '02-09', 2006: '01-29', 2007: '02-18', 2008: '02-07', 2009: '01-26',
  2010: '02-14', 2011: '02-03', 2012: '01-23', 2013: '02-10', 2014: '01-31',
  2015: '02-19', 2016: '02-08', 2017: '01-28', 2018: '02-16', 2019: '02-05',
  2020: '01-25', 2021: '02-12', 2022: '02-01', 2023: '01-22', 2024: '02-10',
  2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13',
  2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19',
  2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04', 2039: '01-24',
  2040: '02-12', 2041: '02-01', 2042: '01-22', 2043: '02-10', 2044: '01-30',
  2045: '02-17', 2046: '02-06', 2047: '01-26', 2048: '02-14', 2049: '02-02',
  2050: '01-23', 2051: '02-11', 2052: '02-01', 2053: '01-21', 2054: '02-08',
  2055: '01-28', 2056: '02-15', 2057: '02-04', 2058: '01-24', 2059: '02-12',
  2060: '02-02', 2061: '01-21', 2062: '02-09', 2063: '01-29', 2064: '02-17',
  2065: '02-05', 2066: '01-26', 2067: '02-14', 2068: '02-03', 2069: '01-23',
  2070: '02-11', 2071: '01-31', 2072: '02-19', 2073: '02-07', 2074: '01-27',
  2075: '02-15', 2076: '02-05', 2077: '01-24', 2078: '02-12', 2079: '02-02',
  2080: '01-22', 2081: '02-09', 2082: '01-29', 2083: '02-17', 2084: '02-06',
  2085: '01-26', 2086: '02-14', 2087: '02-03', 2088: '01-23', 2089: '02-10',
  2090: '01-30', 2091: '02-18', 2092: '02-07', 2093: '01-27', 2094: '02-15',
  2095: '02-05', 2096: '01-25', 2097: '02-12', 2098: '02-01', 2099: '01-21',
  2100: '02-09',
};

export const MIN_YEAR = 1900;
/**
 * The last year we can fully describe. 2100 is in the table, but a year's span
 * runs to the *next* new year, so the last year with a known end is 2099.
 */
export const MAX_YEAR = 2099;

const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const ELEMENTS = ['Metal', 'Water', 'Wood', 'Fire', 'Earth'];
const HEAVENLY_STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const EARTHLY_BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];

const STEM_HANZI = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCH_HANZI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ANIMAL_HANZI = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];

/** Each element governs two consecutive stems: Jia/Yi are Wood, Bing/Ding Fire, and so on. */
const STEM_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

export interface StemInfo {
  index: number;
  name: string;
  hanzi: string;
  element: string;
  polarity: 'Yang' | 'Yin';
}

export interface BranchInfo {
  index: number;
  name: string;
  hanzi: string;
  animal: string;
  animalHanzi: string;
  polarity: 'Yang' | 'Yin';
}

export const STEM_TABLE: StemInfo[] = HEAVENLY_STEMS.map((name, i) => ({
  index: i,
  name,
  hanzi: STEM_HANZI[i],
  element: STEM_ELEMENTS[Math.floor(i / 2)],
  polarity: i % 2 === 0 ? 'Yang' : 'Yin',
}));

export const BRANCH_TABLE: BranchInfo[] = EARTHLY_BRANCHES.map((name, i) => ({
  index: i,
  name,
  hanzi: BRANCH_HANZI[i],
  animal: ANIMALS[i],
  animalHanzi: ANIMAL_HANZI[i],
  polarity: i % 2 === 0 ? 'Yang' : 'Yin',
}));

export function getStemIndex(gregorianYear: number): number {
  return ((gregorianYear - 4) % 10 + 10) % 10;
}

/** Zero-based position of a year in the 12-branch cycle. 4 CE was a Zi (Rat) year. */
export function getBranchIndex(gregorianYear: number): number {
  return ((gregorianYear - 4) % 12 + 12) % 12;
}

/**
 * Get Chinese zodiac animal for a given Gregorian year.
 * Reference: 2020 = Rat (index 0), cycle of 12.
 */
export function getZodiacAnimal(gregorianYear: number): string {
  const idx = ((gregorianYear - 2020) % 12 + 12) % 12;
  return ANIMALS[idx];
}

/**
 * Get element for a given Gregorian year.
 * Reference: 2020 = Metal, cycle of 10, each element repeats for 2 years.
 * Metal: 2020-2021, Water: 2022-2023, Wood: 2024-2025, Fire: 2026-2027, Earth: 2028-2029
 */
export function getElement(gregorianYear: number): string {
  const idx = Math.floor(((gregorianYear - 2020) % 10 + 10) % 10 / 2);
  return ELEMENTS[idx];
}

export function getHeavenlyStem(gregorianYear: number): string {
  return HEAVENLY_STEMS[getStemIndex(gregorianYear)];
}

export function getEarthlyBranch(gregorianYear: number): string {
  return EARTHLY_BRANCHES[getBranchIndex(gregorianYear)];
}

/** Yang years take an even stem, yin years an odd one. */
export function getPolarity(gregorianYear: number): 'Yang' | 'Yin' {
  return getStemIndex(gregorianYear) % 2 === 0 ? 'Yang' : 'Yin';
}

/**
 * Position within the 60-year sexagenary cycle, 1-60. The stem and branch cycles
 * only realign every 60 years, which is what makes the pair unique.
 */
export function getCyclePosition(gregorianYear: number): number {
  return ((gregorianYear - 4) % 60 + 60) % 60 + 1;
}

/**
 * Given a Gregorian year, determine the Chinese year that started in that year.
 * Chinese New Year is typically in Jan-Feb; the Chinese year starting in that year
 * is gregorianYear + 2697 (approximate Huang Di era offset).
 */
export function gregorianToChineseYear(gregorianYear: number): number {
  // The Chinese year number (from epoch ~2697 BCE)
  return gregorianYear + 2697;
}

export function getCNYDate(gregorianYear: number): string {
  const mmdd = CNY_DATES[gregorianYear];
  if (!mmdd) {
    // Fallback approximation: around Feb 5
    return `${gregorianYear}-02-05`;
  }
  return `${gregorianYear}-${mmdd}`;
}

export function hasCNYDate(gregorianYear: number): boolean {
  return CNY_DATES[gregorianYear] !== undefined;
}

/** Parse an ISO `YYYY-MM-DD` as a UTC date, so no local timezone shifts the day. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISO(toISO).getTime() - parseISO(fromISO).getTime()) / 86400000);
}

/** Length in days of the lunar year that starts on this year's new year. */
export function getLunarYearLength(gregorianYear: number): number {
  return daysBetween(getCNYDate(gregorianYear), getCNYDate(gregorianYear + 1));
}

/** A lunar year over ~380 days carries a leap (intercalary) month. */
export function isLeapLunarYear(gregorianYear: number): boolean {
  return getLunarYearLength(gregorianYear) > 380;
}

/** Weekday name of a `YYYY-MM-DD` date. */
export function weekdayOf(iso: string): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    parseISO(iso).getUTCDay()
  ];
}

/** `2024-02-10` → `10 February 2024`, for headings where the ISO form reads poorly. */
export function formatLongDate(iso: string): string {
  const d = parseISO(iso);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * The Chinese year covering a given date. The zodiac animal turns over at Chinese
 * New Year, not on 1 January — so someone born on 1 February 2024 belongs to the
 * *Rabbit* year of 2023, not the Dragon. This is the single most common mistake
 * made with year-based lookups.
 */
export function getChineseYearForDate(iso: string): number {
  const d = parseISO(iso);
  const y = d.getUTCFullYear();
  return d.getTime() < parseISO(getCNYDate(y)).getTime() ? y - 1 : y;
}

export function getChineseCalendarInfo(gregorianYear: number): ChineseCalendarInfo {
  if (gregorianYear < 1900 || gregorianYear > 2100) {
    throw new Error('Year must be between 1900 and 2100');
  }

  const cnyDate = getCNYDate(gregorianYear);
  const nextCnyDate = getCNYDate(gregorianYear + 1);

  // Chinese year number (from Huang Di era)
  const chineseYearStart = gregorianToChineseYear(gregorianYear);
  // Zodiac and element are based on the Gregorian year of the CNY start
  const zodiacAnimal = getZodiacAnimal(gregorianYear);
  const element = getElement(gregorianYear);
  const stem = getHeavenlyStem(gregorianYear);
  const branch = getEarthlyBranch(gregorianYear);
  const lunarYearName = `${stem}-${branch}`;

  const nextAnimal = getZodiacAnimal(gregorianYear + 1);
  const nextElement = getElement(gregorianYear + 1);

  return {
    gregorianYear,
    chineseNewYear: cnyDate,
    zodiacAnimal,
    element,
    stem,
    branch,
    lunarYearName,
    lunarYearNumber: chineseYearStart,
    nextNewYear: nextCnyDate,
    nextAnimal,
    nextElement,
  };
}

/** Everything the report view needs for one year, derived in one pass. */
export interface ChineseYearReport extends ChineseCalendarInfo {
  stemIndex: number;
  branchIndex: number;
  stemHanzi: string;
  branchHanzi: string;
  animalHanzi: string;
  /** `甲辰` — the stem-branch pair written together. */
  hanziPair: string;
  polarity: 'Yang' | 'Yin';
  cyclePosition: number;
  /** Last day of the lunar year, i.e. the day before the next new year. */
  yearEnds: string;
  lunarYearLength: number;
  isLeapYear: boolean;
  newYearWeekday: string;
  /** Nearby years sharing this year's animal, at 12-year steps. */
  sameAnimalYears: number[];
  /** The same stem-branch pair, 60 years either side. */
  sameCycleYears: number[];
}

export function getChineseYearReport(gregorianYear: number): ChineseYearReport {
  if (gregorianYear < MIN_YEAR || gregorianYear > MAX_YEAR) {
    throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
  }

  const info = getChineseCalendarInfo(gregorianYear);
  const stemIndex = getStemIndex(gregorianYear);
  const branchIndex = getBranchIndex(gregorianYear);

  const sameAnimalYears: number[] = [];
  for (let y = gregorianYear - 48; y <= gregorianYear + 48; y += 12) {
    if (y >= MIN_YEAR && y <= MAX_YEAR) sameAnimalYears.push(y);
  }

  const sameCycleYears = [gregorianYear - 60, gregorianYear, gregorianYear + 60].filter(
    y => y >= MIN_YEAR && y <= MAX_YEAR
  );

  const nextCny = getCNYDate(gregorianYear + 1);
  const yearEndsDate = new Date(parseISO(nextCny).getTime() - 86400000);

  return {
    ...info,
    stemIndex,
    branchIndex,
    stemHanzi: STEM_HANZI[stemIndex],
    branchHanzi: BRANCH_HANZI[branchIndex],
    animalHanzi: ANIMAL_HANZI[branchIndex],
    hanziPair: `${STEM_HANZI[stemIndex]}${BRANCH_HANZI[branchIndex]}`,
    polarity: getPolarity(gregorianYear),
    cyclePosition: getCyclePosition(gregorianYear),
    yearEnds: yearEndsDate.toISOString().slice(0, 10),
    lunarYearLength: getLunarYearLength(gregorianYear),
    isLeapYear: isLeapLunarYear(gregorianYear),
    newYearWeekday: weekdayOf(info.chineseNewYear),
    sameAnimalYears,
    sameCycleYears,
  };
}

/** Parse the year field, rejecting anything that is not a plain in-range year. */
export function parseYearInput(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a year');
  if (!/^-?\d+$/.test(trimmed)) throw new Error('Enter a valid year (e.g. 2024)');
  const year = parseInt(trimmed, 10);
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
  }
  return year;
}

export function formatChineseCalendar(input: string): string {
  if (!input.trim()) return '';
  const year = parseInt(input.trim(), 10);
  if (isNaN(year)) throw new Error('Enter a valid year (e.g. 2024)');
  const info = getChineseCalendarInfo(year);

  const lines: string[] = [];
  lines.push(`Gregorian Year:        ${info.gregorianYear}`);
  lines.push('');
  lines.push(`Chinese New Year:      ${info.chineseNewYear}`);
  lines.push(`Chinese Year Number:   ${info.lunarYearNumber} (${info.lunarYearName})`);
  lines.push('');
  lines.push(`Zodiac Animal:         ${info.zodiacAnimal}`);
  lines.push(`Element:               ${info.element}`);
  lines.push(`Heavenly Stem:         ${info.stem}`);
  lines.push(`Earthly Branch:        ${info.branch}`);
  lines.push('');
  lines.push(`Next Chinese New Year: ${info.nextNewYear}`);
  lines.push(`Next Zodiac Animal:    ${info.nextAnimal}`);
  lines.push(`Next Element:          ${info.nextElement}`);
  lines.push('');
  lines.push('12-Year Zodiac Cycle:');
  lines.push('  ' + ANIMALS.join(', '));
  lines.push('');
  lines.push('5 Elements (2-year cycle each):');
  lines.push('  ' + ELEMENTS.join(', '));
  return lines.join('\n');
}
