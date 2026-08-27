export type JsonLintResult = {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
  preview?: string;
};

export function lintJson(input: string): JsonLintResult {
  if (!input.trim()) return { valid: false, error: 'Input is empty' };

  try {
    JSON.parse(input);
    const lines = input.split('\n').length;
    const chars = input.length;
    return { valid: true, preview: `✓ Valid JSON\n${lines} lines, ${chars} characters` };
  } catch (e) {
    const msg = (e as Error).message;
    // Extract position from error message
    const posMatch = msg.match(/at position (\d+)/);
    const unexpectedMatch = msg.match(/Unexpected token (.+) in JSON at position (\d+)/);

    let line: number | undefined;
    let column: number | undefined;
    let friendlyMsg = msg;

    if (posMatch || unexpectedMatch) {
      const pos = parseInt(
        unexpectedMatch
          ? unexpectedMatch[2]
          : posMatch![1]
      );
      // Calculate line/column
      const before = input.slice(0, pos);
      line = before.split('\n').length;
      column = before.length - before.lastIndexOf('\n') - 1;

      if (unexpectedMatch) {
        friendlyMsg = `Unexpected token "${unexpectedMatch[1]}" at line ${line}, column ${column}`;
      } else {
        friendlyMsg = `Parse error at line ${line}, column ${column}: ${msg}`;
      }
    }

    return { valid: false, error: friendlyMsg, line, column };
  }
}

export function formatLintResult(result: JsonLintResult): string {
  if (result.valid) return result.preview ?? '✓ Valid JSON';
  return [
    '✗ Invalid JSON',
    '',
    `Error: ${result.error}`,
    ...(result.line ? [`Location: line ${result.line}, column ${result.column}`] : []),
  ].join('\n');
}
