// ─── Markdown to HTML Converter ───────────────────────────────────────────────
// Pure TypeScript — no external dependencies

export function markdownToHtml(md: string): string {
  if (!md.trim()) return '';

  const lines = md.split('\n');
  const output: string[] = [];
  let i = 0;

  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const inlineFormatting = (text: string): string => {
    // Images before links (more specific pattern first)
    let result = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) =>
      '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" />',
    );
    // Links
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText, href) =>
      '<a href="' + escapeHtml(href) + '">' + escapeHtml(linkText) + '</a>',
    );
    // Bold **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic *text* or _text_
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Inline code `code`
    result = result.replace(/`([^`]+)`/g, (_m, code) => '<code>' + escapeHtml(code) + '</code>');
    return result;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      const langAttr = lang ? ' class="language-' + lang + '"' : '';
      output.push('<pre><code' + langAttr + '>' + codeLines.join('\n') + '</code></pre>');
      i++; // skip closing ```
      continue;
    }

    // Horizontal rule --- or *** or ___
    if (/^(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      output.push('<hr />');
      i++;
      continue;
    }

    // ATX headers # ## ###
    const headerMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = inlineFormatting(escapeHtml(headerMatch[2].trim()));
      output.push('<h' + level + '>' + text + '</h' + level + '>');
      i++;
      continue;
    }

    // Blockquote > ...
    if (line.startsWith('> ') || line === '>') {
      const blockLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        blockLines.push(lines[i].slice(2));
        i++;
      }
      output.push('<blockquote>' + markdownToHtml(blockLines.join('\n')) + '</blockquote>');
      continue;
    }

    // Unordered list - item or * item
    if (/^[\-\*\+]\s/.test(line)) {
      output.push('<ul>');
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i])) {
        const content = inlineFormatting(escapeHtml(lines[i].replace(/^[\-\*\+]\s/, '')));
        output.push('  <li>' + content + '</li>');
        i++;
      }
      output.push('</ul>');
      continue;
    }

    // Ordered list 1. item
    if (/^\d+\.\s/.test(line)) {
      output.push('<ol>');
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const content = inlineFormatting(escapeHtml(lines[i].replace(/^\d+\.\s/, '')));
        output.push('  <li>' + content + '</li>');
        i++;
      }
      output.push('</ol>');
      continue;
    }

    // Blank line — paragraph separator
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[\-\*\+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^(?:---+|\*\*\*+|___+)\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const content = paraLines.map(pl => inlineFormatting(escapeHtml(pl))).join('\n');
      output.push('<p>' + content + '</p>');
    }
  }

  return output.join('\n');
}
