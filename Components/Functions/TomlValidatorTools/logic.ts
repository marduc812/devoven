export function formatTomlValidation(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export function getTomlStats(input: string): string {
  const lines = input.split('\n').length;
  const keys = (input.match(/^\s*\w+\s*=/gm) || []).length;
  const tables = (input.match(/^\s*\[/gm) || []).length;
  return `Lines: ${lines} | Keys: ${keys} | Tables: ${tables}`;
}
