export function generateUuidBulk(count: number, format: 'hyphenated' | 'uppercase' | 'no-hyphens' = 'hyphenated'): string[] {
  if (count < 1 || count > 1000 || !Number.isInteger(count)) throw new Error('Count must be between 1 and 1000');
  return Array.from({ length: count }, () => {
    const uuid = crypto.randomUUID();
    if (format === 'uppercase') return uuid.toUpperCase();
    if (format === 'no-hyphens') return uuid.replace(/-/g, '');
    return uuid;
  });
}

export function formatUuidBulk(input: string): string {
  const n = parseInt(input.trim());
  if (isNaN(n) || n < 1) throw new Error('Enter a number between 1 and 1000');
  const uuids = generateUuidBulk(Math.min(n, 1000));
  return uuids.join('\n');
}
