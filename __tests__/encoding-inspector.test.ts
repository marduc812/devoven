import {
  inspectText,
  formatInspection,
  detectIssues,
} from '../Components/Functions/EncodingInspectorTools/logic';

// ─── inspectText ─────────────────────────────────────────────────────────────

describe('inspectText', () => {
  it('returns one CharInfo per character', () => {
    const result = inspectText('ABC');
    expect(result).toHaveLength(3);
  });

  it('assigns correct code points', () => {
    const result = inspectText('A');
    expect(result[0].codePoint).toBe(65);
    expect(result[0].hex).toBe('U+0041');
  });

  it('categorizes digits correctly', () => {
    const result = inspectText('5');
    expect(result[0].category).toBe('Digit');
  });

  it('categorizes latin letters correctly', () => {
    const result = inspectText('a');
    expect(result[0].category).toBe('Latin Letter');
  });

  it('categorizes control characters correctly', () => {
    const result = inspectText('\t');
    expect(result[0].category).toBe('Control');
    expect(result[0].name).toBe('TAB');
  });

  it('categorizes space correctly', () => {
    const result = inspectText(' ');
    expect(result[0].category).toBe('Whitespace');
    expect(result[0].name).toBe('SPACE');
  });

  it('handles empty string', () => {
    const result = inspectText('');
    expect(result).toHaveLength(0);
  });

  it('assigns correct hex for newline', () => {
    const result = inspectText('\n');
    expect(result[0].hex).toBe('U+000A');
    expect(result[0].name).toBe('LF');
  });
});

// ─── formatInspection ────────────────────────────────────────────────────────

describe('formatInspection', () => {
  it('returns enter-text message for empty array', () => {
    expect(formatInspection([])).toBe('Enter text to inspect');
  });

  it('shows hex code in output', () => {
    const chars = inspectText('A');
    const result = formatInspection(chars);
    expect(result).toContain('U+0041');
  });

  it('shows category in output', () => {
    const chars = inspectText('A');
    const result = formatInspection(chars);
    expect(result).toContain('Latin Letter');
  });

  it('shows newline as arrow symbol', () => {
    const chars = inspectText('\n');
    const result = formatInspection(chars);
    expect(result).toContain('↵');
  });

  it('shows tab as arrow symbol', () => {
    const chars = inspectText('\t');
    const result = formatInspection(chars);
    expect(result).toContain('→');
  });

  it('limits output to 200 chars max', () => {
    const longText = 'a'.repeat(300);
    const chars = inspectText(longText);
    const result = formatInspection(chars);
    const lines = result.split('\n');
    expect(lines).toHaveLength(200);
  });
});

// ─── detectIssues ────────────────────────────────────────────────────────────

describe('detectIssues', () => {
  it('returns empty array for clean ASCII text', () => {
    expect(detectIssues('Hello, World!')).toEqual([]);
  });

  it('detects NULL bytes', () => {
    const issues = detectIssues('hello\u0000world');
    expect(issues).toContain('Contains NULL bytes (U+0000)');
  });

  it('detects BOM', () => {
    const issues = detectIssues('\uFEFFhello');
    expect(issues).toContain('Contains BOM (U+FEFF byte order mark)');
  });

  it('detects Windows CRLF line endings', () => {
    const issues = detectIssues('hello\r\nworld');
    expect(issues).toContain('Windows line endings (CRLF)');
  });

  it('detects old Mac CR line endings', () => {
    const issues = detectIssues('hello\rworld');
    expect(issues).toContain('Old Mac line endings (CR only)');
  });

  it('detects zero-width characters', () => {
    const issues = detectIssues('hello\u200Bworld');
    expect(issues).toContain('Contains zero-width characters');
  });

  it('detects non-breaking spaces', () => {
    const issues = detectIssues('hello\u00A0world');
    expect(issues).toContain('Contains non-breaking spaces (U+00A0)');
  });
});
