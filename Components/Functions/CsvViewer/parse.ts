/** Parse one CSV record, including quoted commas, newlines, and doubled quotes. */
export function parseCsvRecord(record: string): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    if (char === '"') {
      if (quoted && record[i + 1] === '"') {
        value += '"';
        i++;
      } else if (quoted || value === '') {
        quoted = !quoted;
      } else {
        value += char;
      }
    } else if (char === ',' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}
