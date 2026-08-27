// ─── A1. CSS Box Shadow Generator ────────────────────────────────────────────

export type BoxShadowLayer = {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
};

export function boxShadowToCSS(layers: BoxShadowLayer[]): string {
  if (layers.length === 0) return 'none';
  return layers.map(l =>
    `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${l.color}`
  ).join(',\n  ');
}

export function cssPropertyBoxShadow(layers: BoxShadowLayer[]): string {
  return `box-shadow: ${boxShadowToCSS(layers)};`;
}

export function parseBoxShadow(css: string): BoxShadowLayer[] {
  if (!css.trim() || css.trim() === 'none') return [];
  return css.split(',').map(part => {
    const s = part.trim();
    const inset = s.includes('inset');
    const cleaned = s.replace('inset', '').trim();
    // Extract color (last token that's not a number with optional px/%)
    const tokens = cleaned.split(/\s+/);
    // Find color — last non-numeric token
    let colorIdx = tokens.length - 1;
    while (colorIdx >= 0 && /^-?\d/.test(tokens[colorIdx])) colorIdx--;
    const color = tokens[colorIdx] ?? 'rgba(0,0,0,0.5)';
    const nums = tokens.filter(t => /^-?\d/.test(t)).map(t => parseFloat(t));
    return {
      offsetX: nums[0] ?? 0,
      offsetY: nums[1] ?? 0,
      blur: nums[2] ?? 0,
      spread: nums[3] ?? 0,
      color,
      inset,
    };
  });
}

// ─── A2. CSS Border Radius Generator ─────────────────────────────────────────

export type BorderRadius = {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  unit: 'px' | '%';
};

export function borderRadiusToCSS(r: BorderRadius): string {
  const u = r.unit;
  if (r.topLeft === r.topRight && r.topRight === r.bottomRight && r.bottomRight === r.bottomLeft) {
    return `border-radius: ${r.topLeft}${u};`;
  }
  return `border-radius: ${r.topLeft}${u} ${r.topRight}${u} ${r.bottomRight}${u} ${r.bottomLeft}${u};`;
}

export function borderRadiusShorthand(r: BorderRadius): string {
  const u = r.unit;
  return `${r.topLeft}${u} ${r.topRight}${u} ${r.bottomRight}${u} ${r.bottomLeft}${u}`;
}

// ─── A3. UUID Validator ───────────────────────────────────────────────────────

export type UuidInfo = {
  valid: boolean;
  version?: number;
  variant?: string;
  formatted?: string;
  uppercase?: string;
};

export function validateUuid(input: string): UuidInfo {
  const s = input.trim().toLowerCase().replace(/[{}]/g, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  if (!uuidRegex.test(s)) {
    // Try without dashes
    const noDash = s.replace(/-/g, '');
    if (/^[0-9a-f]{32}$/.test(noDash)) {
      const formatted = `${noDash.slice(0,8)}-${noDash.slice(8,12)}-${noDash.slice(12,16)}-${noDash.slice(16,20)}-${noDash.slice(20)}`;
      return validateUuid(formatted);
    }
    return {valid: false};
  }

  const version = parseInt(s[14], 16);
  const variantBits = parseInt(s[19], 16);
  let variant = 'Unknown';
  if ((variantBits & 0x8) === 0) variant = 'NCS backward compatibility';
  else if ((variantBits & 0xc) === 0x8) variant = 'RFC 4122 (standard)';
  else if ((variantBits & 0xe) === 0xc) variant = 'Microsoft backward compatibility';
  else variant = 'Reserved';

  return {valid: true, version, variant, formatted: s, uppercase: s.toUpperCase()};
}

export function formatUuidInfo(info: UuidInfo): string {
  if (!info.valid) return 'Invalid UUID';
  return [
    `Valid:     Yes`,
    `Version:   ${info.version}`,
    `Variant:   ${info.variant}`,
    `Lowercase: ${info.formatted}`,
    `Uppercase: ${info.uppercase}`,
  ].join('\n');
}

// ─── A4. Age Calculator ───────────────────────────────────────────────────────

export type AgeResult = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthday: string;
  daysUntilBirthday: number;
  dayOfWeekBorn: string;
  zodiacSign: string;
};

const ZODIAC = [
  {sign:'Capricorn', start:[12,22]}, {sign:'Aquarius', start:[1,20]},
  {sign:'Pisces', start:[2,19]}, {sign:'Aries', start:[3,21]},
  {sign:'Taurus', start:[4,20]}, {sign:'Gemini', start:[5,21]},
  {sign:'Cancer', start:[6,21]}, {sign:'Leo', start:[7,23]},
  {sign:'Virgo', start:[8,23]}, {sign:'Libra', start:[9,23]},
  {sign:'Scorpio', start:[10,23]}, {sign:'Sagittarius', start:[11,22]},
];

export function getZodiacSign(month: number, day: number): string {
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const [m, d] = ZODIAC[i].start;
    if (month > m || (month === m && day >= d)) return ZODIAC[i].sign;
  }
  return 'Capricorn';
}

export function calculateAge(birthdateStr: string, today?: Date): AgeResult {
  const birth = new Date(birthdateStr);
  if (isNaN(birth.getTime())) throw new Error('Invalid date');
  const now = today ?? new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }

  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);

  // Next birthday
  let nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday <= now) nextBday = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const daysUntilBirthday = Math.ceil((nextBday.getTime() - now.getTime()) / 86400000);

  const days_of_week = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  return {
    years, months, days, totalDays,
    nextBirthday: fmtDate(nextBday),
    daysUntilBirthday,
    dayOfWeekBorn: days_of_week[birth.getDay()],
    zodiacSign: getZodiacSign(birth.getMonth() + 1, birth.getDate()),
  };
}

export function formatAgeResult(r: AgeResult): string {
  return [
    `Age:              ${r.years} years, ${r.months} months, ${r.days} days`,
    `Total days:       ${r.totalDays.toLocaleString()}`,
    `Born on:          ${r.dayOfWeekBorn}`,
    `Zodiac sign:      ${r.zodiacSign}`,
    `Next birthday:    ${r.nextBirthday} (in ${r.daysUntilBirthday} days)`,
  ].join('\n');
}
