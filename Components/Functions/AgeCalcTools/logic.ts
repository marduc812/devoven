export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  nextBirthday: string;
  daysUntilBirthday: number;
  dayOfWeekBorn: string;
  zodiacSign: string;
  chineseZodiac: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getZodiacSign(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

const CHINESE_ZODIAC = [
  'Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox',
  'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat',
];

function getChineseZodiac(year: number): string {
  return CHINESE_ZODIAC[year % 12];
}

export function calculateAge(dateOfBirth: string, today?: Date): AgeResult {
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) throw new Error('Invalid date of birth');

  const now = today !== undefined ? today : new Date();
  if (birth > now) throw new Error('Date of birth cannot be in the future');

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;

  // Next birthday
  let nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday.getTime() <= now.getTime()) {
    nextBday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const daysUntilBirthday = Math.ceil((nextBday.getTime() - now.getTime()) / 86400000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalHours,
    nextBirthday: fmtDate(nextBday),
    daysUntilBirthday,
    dayOfWeekBorn: DAYS_OF_WEEK[birth.getDay()],
    zodiacSign: getZodiacSign(birth.getMonth() + 1, birth.getDate()),
    chineseZodiac: getChineseZodiac(birth.getFullYear()),
  };
}

export function formatAgeResult(result: AgeResult): string {
  return [
    '=== Exact Age ===',
    `Age:              ${result.years} years, ${result.months} months, ${result.days} days`,
    '',
    '=== Time Stats ===',
    `Total Days:       ${result.totalDays.toLocaleString()}`,
    `Total Weeks:      ${result.totalWeeks.toLocaleString()}`,
    `Total Hours:      ${result.totalHours.toLocaleString()}`,
    '',
    '=== Birthday Info ===',
    `Day Born On:      ${result.dayOfWeekBorn}`,
    `Next Birthday:    ${result.nextBirthday} (in ${result.daysUntilBirthday} days)`,
    '',
    '=== Zodiac ===',
    `Western Sign:     ${result.zodiacSign}`,
    `Chinese Zodiac:   Year of the ${result.chineseZodiac}`,
  ].join('\n');
}
