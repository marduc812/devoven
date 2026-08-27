export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

export function escapeJson(text: string): string {
  return JSON.stringify(text).slice(1, -1); // Remove surrounding quotes
}

export function unescapeJson(text: string): string {
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    throw new Error('Invalid JSON string escape sequences');
  }
}

export function escapeSql(text: string): string {
  return text.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export function escapeShell(text: string): string {
  return "'" + text.replace(/'/g, "'\\''") + "'";
}

export function escapeCsv(text: string): string {
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}
