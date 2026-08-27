function splitWords(input: string): string[] {
  // Split on spaces, hyphens, underscores, dots, slashes, and camelCase boundaries
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s\-_./\\]+/)
    .filter(w => w.length > 0);
}

export interface CaseResult {
  label: string;
  key: string;
  value: string;
}

export function convertAllCases(input: string): CaseResult[] {
  if (!input.trim()) return [];
  const words = splitWords(input);
  const lower = words.map(w => w.toLowerCase());
  const upper = words.map(w => w.toUpperCase());
  const title = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return [
    {
      label: 'camelCase',
      key: 'camel',
      value: lower[0] + title.slice(1).join(''),
    },
    {
      label: 'PascalCase',
      key: 'pascal',
      value: title.join(''),
    },
    {
      label: 'snake_case',
      key: 'snake',
      value: lower.join('_'),
    },
    {
      label: 'SCREAMING_SNAKE_CASE',
      key: 'screaming',
      value: upper.join('_'),
    },
    {
      label: 'kebab-case',
      key: 'kebab',
      value: lower.join('-'),
    },
    {
      label: 'UPPER-KEBAB-CASE',
      key: 'upper-kebab',
      value: upper.join('-'),
    },
    {
      label: 'Train-Case',
      key: 'train',
      value: title.join('-'),
    },
    {
      label: 'dot.case',
      key: 'dot',
      value: lower.join('.'),
    },
    {
      label: 'path/case',
      key: 'path',
      value: lower.join('/'),
    },
    {
      label: 'Title Case',
      key: 'title',
      value: title.join(' '),
    },
    {
      label: 'Sentence case',
      key: 'sentence',
      value: lower[0].charAt(0).toUpperCase() + lower[0].slice(1) + (lower.length > 1 ? ' ' + lower.slice(1).join(' ') : ''),
    },
    {
      label: 'UPPER CASE',
      key: 'upper',
      value: upper.join(' '),
    },
    {
      label: 'lower case',
      key: 'lower',
      value: lower.join(' '),
    },
  ];
}

export function allCasesToText(input: string): string {
  const results = convertAllCases(input);
  if (results.length === 0) return '';
  return results.map(r => `${r.label.padEnd(22)} ${r.value}`).join('\n');
}
