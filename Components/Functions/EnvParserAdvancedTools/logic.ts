// Advanced Env Variable Parser — pure TypeScript, no browser APIs
// Parses .env files and produces detailed analysis

export interface EnvEntry {
  key: string;
  value: string;
  lineNumber: number;
  hasQuotes: boolean;
  quoteType: '"' | "'" | '';
  hasExportPrefix: boolean;
  isEmpty: boolean;
}

export interface EnvIssue {
  severity: 'warning' | 'error';
  message: string;
  key?: string;
  lineNumber?: number;
}

export interface EnvParseResult {
  entries: EnvEntry[];
  issues: EnvIssue[];
  commentLines: number;
  emptyLines: number;
  totalLines: number;
  duplicateKeys: string[];
  jsonOutput: string;
}

export function parseEnvFile(input: string): EnvParseResult {
  const lines = input.split('\n');
  const entries: EnvEntry[] = [];
  const issues: EnvIssue[] = [];
  const seenKeys: Map<string, number[]> = new Map();
  let commentLines = 0;
  let emptyLines = 0;
  let i = 0;

  while (i < lines.length) {
    const lineNum = i + 1;
    let line = lines[i];
    i++;

    const trimmed = line.trim();

    if (trimmed === '') {
      emptyLines++;
      continue;
    }

    if (trimmed.startsWith('#')) {
      commentLines++;
      continue;
    }

    // Handle backslash line continuation
    let fullLine = trimmed;
    while (fullLine.endsWith('\\') && i < lines.length) {
      fullLine = fullLine.slice(0, -1) + lines[i].trim();
      i++;
    }

    // Handle export prefix
    let workLine = fullLine;
    let hasExportPrefix = false;
    if (workLine.startsWith('export ')) {
      hasExportPrefix = true;
      workLine = workLine.slice(7).trim();
    }

    const eqIdx = workLine.indexOf('=');
    if (eqIdx < 0) {
      issues.push({
        severity: 'warning',
        message: 'Line ' + lineNum + ': no "=" found, skipping: ' + fullLine.slice(0, 40),
        lineNumber: lineNum,
      });
      continue;
    }

    const key = workLine.slice(0, eqIdx).trim();
    let rawValue = workLine.slice(eqIdx + 1);

    if (!key) {
      issues.push({
        severity: 'warning',
        message: 'Line ' + lineNum + ': empty key, skipping',
        lineNumber: lineNum,
      });
      continue;
    }

    // Check key validity
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      issues.push({
        severity: 'warning',
        message: 'Key "' + key + '" contains special characters (line ' + lineNum + ')',
        key,
        lineNumber: lineNum,
      });
    }

    // Parse value and detect quotes
    let hasQuotes = false;
    let quoteType: '"' | "'" | '' = '';
    let value = rawValue;

    if (rawValue.startsWith('"')) {
      hasQuotes = true;
      quoteType = '"';
      const endQuote = rawValue.indexOf('"', 1);
      if (endQuote >= 0) {
        value = rawValue.slice(1, endQuote);
        // Handle escape sequences in double-quoted values
        value = value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } else {
        value = rawValue.slice(1);
        issues.push({
          severity: 'warning',
          message: 'Key "' + key + '" has unclosed double quote (line ' + lineNum + ')',
          key,
          lineNumber: lineNum,
        });
      }
    } else if (rawValue.startsWith("'")) {
      hasQuotes = true;
      quoteType = "'";
      const endQuote = rawValue.indexOf("'", 1);
      if (endQuote >= 0) {
        value = rawValue.slice(1, endQuote);
        // Single-quoted: no escape processing
      } else {
        value = rawValue.slice(1);
        issues.push({
          severity: 'warning',
          message: 'Key "' + key + '" has unclosed single quote (line ' + lineNum + ')',
          key,
          lineNumber: lineNum,
        });
      }
    } else {
      // Unquoted: strip inline comments
      const commentIdx = rawValue.indexOf(' #');
      if (commentIdx >= 0) {
        value = rawValue.slice(0, commentIdx).trim();
      } else {
        value = rawValue.trim();
      }
    }

    const isEmpty = value === '';
    if (isEmpty) {
      issues.push({
        severity: 'warning',
        message: 'Key "' + key + '" has an empty value (line ' + lineNum + ')',
        key,
        lineNumber: lineNum,
      });
    }

    if (value.length > 1000) {
      issues.push({
        severity: 'warning',
        message: 'Key "' + key + '" has a very long value (' + value.length + ' chars)',
        key,
        lineNumber: lineNum,
      });
    }

    const existing = seenKeys.get(key) || [];
    existing.push(lineNum);
    seenKeys.set(key, existing);

    entries.push({ key, value, lineNumber: lineNum, hasQuotes, quoteType, hasExportPrefix, isEmpty });
  }

  // Detect duplicates
  const duplicateKeys: string[] = [];
  seenKeys.forEach((lineNums, key) => {
    if (lineNums.length > 1) {
      duplicateKeys.push(key);
      issues.push({
        severity: 'error',
        message: 'Duplicate key "' + key + '" found on lines: ' + lineNums.join(', '),
        key,
      });
    }
  });

  const jsonObj: Record<string, string> = {};
  for (const entry of entries) {
    jsonObj[entry.key] = entry.value;
  }

  return {
    entries,
    issues,
    commentLines,
    emptyLines,
    totalLines: lines.length,
    duplicateKeys,
    jsonOutput: JSON.stringify(jsonObj, null, 2),
  };
}

export function formatEnvParseResult(input: string): string {
  if (!input.trim()) return '';

  const result = parseEnvFile(input);

  const lines: string[] = [];

  lines.push('=== Parsed Variables (' + result.entries.length + ') ===');
  lines.push('');
  lines.push(result.jsonOutput);
  lines.push('');

  lines.push('=== Summary ===');
  lines.push('Total lines:      ' + result.totalLines);
  lines.push('Variables:        ' + result.entries.length);
  lines.push('Comment lines:    ' + result.commentLines);
  lines.push('Empty lines:      ' + result.emptyLines);
  lines.push('Duplicate keys:   ' + (result.duplicateKeys.length > 0 ? result.duplicateKeys.join(', ') : 'None'));
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('=== Issues (' + result.issues.length + ') ===');
    for (const issue of result.issues) {
      const prefix = issue.severity === 'error' ? '[ERROR]' : '[WARN] ';
      lines.push(prefix + ' ' + issue.message);
    }
    lines.push('');
  }

  lines.push('=== All Keys ===');
  lines.push(result.entries.map(e => e.key).join('\n'));

  return lines.join('\n');
}
