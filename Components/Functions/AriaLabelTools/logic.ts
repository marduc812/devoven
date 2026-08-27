// All functions are pure (no browser APIs).

export type AriaIssue = {
  element: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning';
};

export type AriaAnalysisResult = {
  issues: AriaIssue[];
  improvedHtml: string;
  issueCount: number;
};

// ─── HTML analysis helpers ────────────────────────────────────────────────────

function hasAttribute(tag: string, attr: string): boolean {
  const re = new RegExp(attr + '\\s*=', 'i');
  return re.test(tag);
}

function getTagContent(openTag: string, html: string, tagStart: number): string {
  const closeIdx = html.indexOf('>', tagStart);
  if (closeIdx === -1) return '';
  // Find closing tag — simplified: find next </tagname>
  const tagNameMatch = openTag.match(/^<(\w+)/);
  if (!tagNameMatch) return '';
  const tagName = tagNameMatch[1];
  const closeTag = '</' + tagName + '>';
  const closeTagIdx = html.toLowerCase().indexOf(closeTag.toLowerCase(), closeIdx);
  if (closeTagIdx === -1) return '';
  return html.slice(closeIdx + 1, closeTagIdx).replace(/<[^>]+>/g, '').trim();
}

export function analyzeAriaIssues(html: string): AriaAnalysisResult {
  const issues: AriaIssue[] = [];
  let improved = html;

  if (!html.trim()) {
    return { issues: [], improvedHtml: '', issueCount: 0 };
  }

  // ── Buttons without text or aria-label ───────────────────────────────────
  const btnRe = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
  let match: RegExpExecArray | null;
  while ((match = btnRe.exec(html)) !== null) {
    const attrs = match[1];
    const inner = match[2].replace(/<[^>]+>/g, '').trim();
    const hasLabel = /aria-label\s*=/i.test(attrs);
    const hasLabelBy = /aria-labelledby\s*=/i.test(attrs);
    if (!inner && !hasLabel && !hasLabelBy) {
      issues.push({
        element: '<button>',
        issue: 'Button has no accessible text (no text content, aria-label, or aria-labelledby)',
        suggestion: 'Add aria-label="Descriptive action" or add visible text inside the button',
        severity: 'error',
      });
      improved = improved.replace(match[0], match[0].replace('<button', '<button aria-label="Action"'));
    }
  }

  // ── Images without alt ────────────────────────────────────────────────────
  const imgRe = /<img([^>]*?)>/gi;
  while ((match = imgRe.exec(html)) !== null) {
    const attrs = match[1];
    if (!/\balt\s*=/i.test(attrs)) {
      issues.push({
        element: '<img>',
        issue: 'Image is missing an alt attribute',
        suggestion: 'Add alt="Descriptive text" or alt="" for decorative images',
        severity: 'error',
      });
      improved = improved.replace(match[0], match[0].replace('<img', '<img alt="Descriptive image"'));
    }
  }

  // ── Inputs without labels ─────────────────────────────────────────────────
  const inputRe = /<input([^>]*?)>/gi;
  while ((match = inputRe.exec(html)) !== null) {
    const attrs = match[1];
    const typeMatch = attrs.match(/type\s*=\s*["']?(\w+)/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text';
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const hasLabel = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs) || /id\s*=/i.test(attrs);
    if (!hasLabel) {
      issues.push({
        element: '<input>',
        issue: 'Input field has no accessible label (no aria-label, aria-labelledby, or associated <label>)',
        suggestion: 'Add aria-label="Field description" or associate a <label for="inputId">',
        severity: 'error',
      });
      improved = improved.replace(match[0], match[0].replace('<input', '<input aria-label="Field label"'));
    }
  }

  // ── Links without descriptive text ────────────────────────────────────────
  const linkRe = /<a([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((match = linkRe.exec(html)) !== null) {
    const attrs = match[1];
    const inner = match[2].replace(/<[^>]+>/g, '').trim();
    const hasLabel = /aria-label\s*=/i.test(attrs);
    const nonDescriptive = /^(click here|here|read more|more|link|learn more)$/i.test(inner);
    if (!inner && !hasLabel) {
      issues.push({
        element: '<a>',
        issue: 'Link has no accessible text',
        suggestion: 'Add aria-label="Link destination description" or add descriptive text content',
        severity: 'error',
      });
      improved = improved.replace(match[0], match[0].replace('<a', '<a aria-label="Link description"'));
    } else if (nonDescriptive && !hasLabel) {
      issues.push({
        element: '<a>',
        issue: `Link text "${inner}" is not descriptive enough for screen readers`,
        suggestion: 'Use descriptive text or add aria-label="More about [topic]"',
        severity: 'warning',
      });
    }
  }

  // ── Form without role or landmark ─────────────────────────────────────────
  const formRe = /<form([^>]*)>/gi;
  while ((match = formRe.exec(html)) !== null) {
    const attrs = match[1];
    if (!/aria-label\s*=/i.test(attrs) && !/aria-labelledby\s*=/i.test(attrs)) {
      issues.push({
        element: '<form>',
        issue: 'Form has no accessible label',
        suggestion: 'Add aria-label="Form purpose" or use <legend> inside <fieldset>',
        severity: 'warning',
      });
    }
  }

  // ── nav without aria-label ────────────────────────────────────────────────
  const navRe = /<nav([^>]*)>/gi;
  while ((match = navRe.exec(html)) !== null) {
    const attrs = match[1];
    if (!/aria-label\s*=/i.test(attrs)) {
      issues.push({
        element: '<nav>',
        issue: 'Navigation landmark has no aria-label (required when multiple <nav> exist)',
        suggestion: 'Add aria-label="Main navigation" or aria-label="Breadcrumb"',
        severity: 'warning',
      });
      improved = improved.replace(match[0], match[0].replace('<nav', '<nav aria-label="Navigation"'));
    }
  }

  return {
    issues,
    improvedHtml: improved,
    issueCount: issues.length,
  };
}

// ─── Pattern suggestions ───────────────────────────────────────────────────────

export type PatternSuggestion = {
  pattern: string;
  html: string;
};

export function getPatternSuggestions(): PatternSuggestion[] {
  return [
    {
      pattern: 'Modal Dialog',
      html: `<div role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Dialog Title</h2>
  <p id="modal-desc">Description of the dialog purpose.</p>
  <button aria-label="Close dialog">×</button>
</div>`,
    },
    {
      pattern: 'Main Navigation',
      html: `<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/home" aria-current="page">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>`,
    },
    {
      pattern: 'Search Form',
      html: `<form role="search" aria-label="Site search">
  <label for="search-input">Search</label>
  <input id="search-input" type="search" aria-label="Search query" />
  <button type="submit" aria-label="Submit search">Search</button>
</form>`,
    },
    {
      pattern: 'Data Table',
      html: `<table aria-label="User data" role="table">
  <caption>List of registered users</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>alice@example.com</td>
      <td>Admin</td>
    </tr>
  </tbody>
</table>`,
    },
    {
      pattern: 'Pagination',
      html: `<nav aria-label="Pagination">
  <button aria-label="Go to previous page" aria-disabled="false">Previous</button>
  <button aria-label="Page 1" aria-current="page">1</button>
  <button aria-label="Page 2">2</button>
  <button aria-label="Page 3">3</button>
  <button aria-label="Go to next page">Next</button>
</nav>`,
    },
  ];
}

export function formatAnalysisOutput(result: AriaAnalysisResult): string {
  if (!result.issueCount && !result.improvedHtml) {
    return '';
  }
  if (!result.issueCount) {
    return 'No accessibility issues found. HTML looks good!\n\n--- Improved HTML ---\n' + result.improvedHtml;
  }
  const lines: string[] = [
    `Found ${result.issueCount} accessibility issue(s):\n`,
  ];
  result.issues.forEach((issue, i) => {
    lines.push(`[${issue.severity.toUpperCase()}] ${i + 1}. ${issue.element}`);
    lines.push(`  Issue:      ${issue.issue}`);
    lines.push(`  Suggestion: ${issue.suggestion}`);
    lines.push('');
  });
  lines.push('--- Suggested Improved HTML ---');
  lines.push(result.improvedHtml);
  return lines.join('\n');
}
