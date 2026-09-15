import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Markdown to HTML for the preview pane, sanitized.
 *
 * marked passes raw HTML through by design, and the preview renders the result
 * with dangerouslySetInnerHTML, so everything it emits has to go through
 * DOMPurify first. Do not inline marked() at the call site again.
 */
export function renderMarkdown(md: string): string {
  // DOMPurify without a DOM returns its input UNCHANGED rather than throwing,
  // which would turn this function into a silent passthrough the moment anyone
  // calls it during SSR. Fail loudly instead.
  if (!DOMPurify.isSupported) {
    throw new Error('renderMarkdown requires a DOM; it must run in the browser');
  }
  const raw = marked(md) as string;
  // USE_PROFILES html-only drops SVG and MathML, which Markdown does not need
  // and which carry the mXSS history.
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}
