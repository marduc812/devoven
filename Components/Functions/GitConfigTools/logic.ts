import { emptyRecord } from '../safeObject';

export function gitConfigToJson(input: string): string {
  const result = emptyRecord<Record<string, string>>();
  let currentSection = '';

  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    // Section header: [core] or [remote "origin"]
    const sectionMatch = trimmed.match(/^\[(\w+)(?:\s+"([^"]*)")?\]$/);
    if (sectionMatch) {
      const section = sectionMatch[1];
      const subsection = sectionMatch[2];
      currentSection = subsection ? `${section}.${subsection}` : section;
      if (!result[currentSection]) result[currentSection] = emptyRecord<string>();
      continue;
    }

    // Key-value: key = value
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.*)$/);
    if (kvMatch && currentSection) {
      result[currentSection][kvMatch[1]] = kvMatch[2].trim();
    }
  }

  return JSON.stringify(result, null, 2);
}

export function jsonToGitConfig(input: string): string {
  const obj = JSON.parse(input) as Record<string, Record<string, string>>;
  const lines: string[] = [];

  for (const [section, values] of Object.entries(obj)) {
    const parts = section.split('.');
    if (parts.length === 1) {
      lines.push(`[${section}]`);
    } else {
      lines.push(`[${parts[0]} "${parts.slice(1).join('.')}"]`);
    }
    for (const [key, val] of Object.entries(values)) {
      lines.push(`\t${key} = ${val}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
