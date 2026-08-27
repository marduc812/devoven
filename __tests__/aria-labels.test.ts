import { analyzeAriaIssues, formatAnalysisOutput, getPatternSuggestions } from '../Components/Functions/AriaLabelTools/logic';

describe('analyzeAriaIssues', () => {
  it('returns no issues for empty input', () => {
    const result = analyzeAriaIssues('');
    expect(result.issueCount).toBe(0);
    expect(result.issues).toHaveLength(0);
  });

  it('flags button with no text and no aria-label', () => {
    const result = analyzeAriaIssues('<button></button>');
    expect(result.issueCount).toBeGreaterThan(0);
    const issue = result.issues.find(i => i.element === '<button>');
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe('error');
  });

  it('does not flag button with text content', () => {
    const result = analyzeAriaIssues('<button>Click me</button>');
    const buttonIssues = result.issues.filter(i => i.element === '<button>');
    expect(buttonIssues).toHaveLength(0);
  });

  it('does not flag button with aria-label', () => {
    const result = analyzeAriaIssues('<button aria-label="Close"></button>');
    const buttonIssues = result.issues.filter(i => i.element === '<button>');
    expect(buttonIssues).toHaveLength(0);
  });

  it('flags image without alt', () => {
    const result = analyzeAriaIssues('<img src="test.png">');
    const imgIssue = result.issues.find(i => i.element === '<img>');
    expect(imgIssue).toBeDefined();
    expect(imgIssue!.severity).toBe('error');
  });

  it('does not flag image with alt', () => {
    const result = analyzeAriaIssues('<img src="test.png" alt="A test image">');
    const imgIssues = result.issues.filter(i => i.element === '<img>');
    expect(imgIssues).toHaveLength(0);
  });

  it('does not flag image with empty alt (decorative)', () => {
    const result = analyzeAriaIssues('<img src="test.png" alt="">');
    const imgIssues = result.issues.filter(i => i.element === '<img>');
    expect(imgIssues).toHaveLength(0);
  });

  it('flags input without label', () => {
    const result = analyzeAriaIssues('<input type="text">');
    const inputIssue = result.issues.find(i => i.element === '<input>');
    expect(inputIssue).toBeDefined();
    expect(inputIssue!.severity).toBe('error');
  });

  it('does not flag hidden input', () => {
    const result = analyzeAriaIssues('<input type="hidden" name="token">');
    const inputIssues = result.issues.filter(i => i.element === '<input>');
    expect(inputIssues).toHaveLength(0);
  });

  it('does not flag input with aria-label', () => {
    const result = analyzeAriaIssues('<input type="text" aria-label="Search">');
    const inputIssues = result.issues.filter(i => i.element === '<input>');
    expect(inputIssues).toHaveLength(0);
  });

  it('does not flag input with id (for label association)', () => {
    const result = analyzeAriaIssues('<input type="text" id="name">');
    const inputIssues = result.issues.filter(i => i.element === '<input>');
    expect(inputIssues).toHaveLength(0);
  });

  it('flags link with no text', () => {
    const result = analyzeAriaIssues('<a href="/home"></a>');
    const linkIssue = result.issues.find(i => i.element === '<a>');
    expect(linkIssue).toBeDefined();
    expect(linkIssue!.severity).toBe('error');
  });

  it('flags non-descriptive link text', () => {
    const result = analyzeAriaIssues('<a href="/page">click here</a>');
    const linkIssue = result.issues.find(i => i.element === '<a>');
    expect(linkIssue).toBeDefined();
    expect(linkIssue!.severity).toBe('warning');
  });

  it('does not flag descriptive link text', () => {
    const result = analyzeAriaIssues('<a href="/about">Read our privacy policy</a>');
    const linkIssues = result.issues.filter(i => i.element === '<a>');
    expect(linkIssues).toHaveLength(0);
  });

  it('flags nav without aria-label', () => {
    const result = analyzeAriaIssues('<nav><ul></ul></nav>');
    const navIssue = result.issues.find(i => i.element === '<nav>');
    expect(navIssue).toBeDefined();
  });

  it('does not flag nav with aria-label', () => {
    const result = analyzeAriaIssues('<nav aria-label="Main navigation"><ul></ul></nav>');
    const navIssues = result.issues.filter(i => i.element === '<nav>');
    expect(navIssues).toHaveLength(0);
  });

  it('adds aria-label to button in improved HTML', () => {
    const result = analyzeAriaIssues('<button></button>');
    expect(result.improvedHtml).toContain('aria-label=');
  });

  it('adds alt to img in improved HTML', () => {
    const result = analyzeAriaIssues('<img src="test.png">');
    expect(result.improvedHtml).toContain('alt=');
  });
});

describe('formatAnalysisOutput', () => {
  it('returns empty string for empty result', () => {
    const result = analyzeAriaIssues('');
    expect(formatAnalysisOutput(result)).toBe('');
  });

  it('includes issue count in output', () => {
    const result = analyzeAriaIssues('<button></button>');
    const output = formatAnalysisOutput(result);
    expect(output).toContain('issue');
  });

  it('includes improved HTML in output', () => {
    const result = analyzeAriaIssues('<img src="test.png">');
    const output = formatAnalysisOutput(result);
    expect(output).toContain('Suggested Improved HTML');
  });
});

describe('getPatternSuggestions', () => {
  it('returns at least 5 patterns', () => {
    const patterns = getPatternSuggestions();
    expect(patterns.length).toBeGreaterThanOrEqual(5);
  });

  it('each pattern has name and html', () => {
    const patterns = getPatternSuggestions();
    for (const p of patterns) {
      expect(p.pattern).toBeTruthy();
      expect(p.html).toContain('<');
    }
  });

  it('includes modal pattern', () => {
    const patterns = getPatternSuggestions();
    const modal = patterns.find(p => p.pattern.toLowerCase().includes('modal'));
    expect(modal).toBeDefined();
  });

  it('includes navigation pattern', () => {
    const patterns = getPatternSuggestions();
    const nav = patterns.find(p => p.pattern.toLowerCase().includes('nav'));
    expect(nav).toBeDefined();
  });
});
