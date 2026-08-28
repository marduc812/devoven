export function jsonlToJson(input: string): string {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const objects = lines.map((line, i) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      throw new Error(`Line ${i + 1}: ${(e as Error).message}`);
    }
  });
  return JSON.stringify(objects, null, 2);
}

export function jsonToJsonl(input: string): string {
  const data = JSON.parse(input);
  if (!Array.isArray(data)) throw new Error('Input must be a JSON array');
  return data.map(item => JSON.stringify(item)).join('\n');
}

export function getJsonlStats(input: string): string {
  const lines = input.split('\n').filter(l => l.trim());
  return `${lines.length} lines`;
}
