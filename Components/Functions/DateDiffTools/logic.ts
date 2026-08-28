export function parseDateInput(s: string): Date {
  const d = new Date(s.trim());
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${s}". Use YYYY-MM-DD format.`);
  return d;
}

export function dateDiff(date1Str: string, date2Str: string): string {
  const d1 = parseDateInput(date1Str);
  const d2 = parseDateInput(date2Str);
  const msPerDay = 86400000;
  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffMs / msPerDay);
  const absDays = Math.abs(diffDays);
  const weeks = Math.floor(absDays / 7);
  const remainDays = absDays % 7;

  const [earlier, later] = diffDays >= 0 ? [d1, d2] : [d2, d1];
  let years = later.getFullYear() - earlier.getFullYear();
  let months = later.getMonth() - earlier.getMonth();
  if (months < 0) { years--; months += 12; }
  const dayInMonth = later.getDate() - earlier.getDate();
  if (dayInMonth < 0) { months--; if (months < 0) { years--; months += 12; } }

  const direction = diffDays === 0 ? 'Same day' : diffDays > 0 ? 'Date 2 is after Date 1' : 'Date 2 is before Date 1';

  return [
    `Date 1:       ${d1.toISOString().split('T')[0]}`,
    `Date 2:       ${d2.toISOString().split('T')[0]}`,
    '',
    `Direction:    ${direction}`,
    `Total days:   ${absDays}`,
    `Weeks:        ${weeks} weeks, ${remainDays} days`,
    `Approx:       ${years} year(s), ${months >= 0 ? months : 0} month(s)`,
    '',
    `Milliseconds: ${Math.abs(diffMs)}`,
    `Hours:        ${Math.round(Math.abs(diffMs) / 3600000)}`,
  ].join('\n');
}
