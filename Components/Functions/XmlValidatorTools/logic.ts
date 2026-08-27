export type XmlValidationResult = {
  valid: boolean;
  error?: string;
  stats?: {
    elements: number;
    attributes: number;
    textNodes: number;
    depth: number;
  };
};

export function validateXml(input: string): XmlValidationResult {
  if (!input.trim()) return { valid: false, error: 'Input is empty' };

  // Check basic XML structure using regex-based validation
  // This is a simplified validator for common errors

  // Check balanced tags
  const tagStack: string[] = [];
  const tagRegex = /<(\/?)([\w:.-]+)[^>]*?(\/)?>|<!--|-->/g;
  let inComment = false;
  let match;

  try {
    while ((match = tagRegex.exec(input)) !== null) {
      const full = match[0];
      if (full === '<!--') { inComment = true; continue; }
      if (full === '-->') { inComment = false; continue; }
      if (inComment) continue;

      const isClose = match[1] === '/';
      const isSelfClose = match[3] === '/';
      const tagName = match[2];

      if (!tagName) continue;

      if (isClose) {
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
          return { valid: false, error: `Unexpected closing tag </${tagName}>` };
        }
        tagStack.pop();
      } else if (!isSelfClose) {
        tagStack.push(tagName);
      }
    }

    if (tagStack.length > 0) {
      return { valid: false, error: `Unclosed tag: <${tagStack[tagStack.length - 1]}>` };
    }

    // Count elements and attributes
    const elements = (input.match(/<[\w:.-]+/g) || []).length;
    const attributes = (input.match(/\s[\w:.-]+=["'][^"']*["']/g) || []).length;
    const depth = Math.max(...(input.match(/<[^/][^>]*>/g) || []).map((_, i) => i), 0);

    return { valid: true, stats: { elements, attributes, textNodes: 0, depth } };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function formatXmlValidation(result: XmlValidationResult): string {
  if (!result.valid) {
    return `✗ Invalid XML\n\nError: ${result.error}`;
  }
  const s = result.stats!;
  return [
    '✓ Valid XML',
    '',
    `Elements:   ${s.elements}`,
    `Attributes: ${s.attributes}`,
  ].join('\n');
}

export function prettyPrintXml(input: string): string {
  let result = input.trim();
  // Remove existing formatting
  result = result.replace(/>\s+</g, '><');
  // Add newlines and indent
  let indent = 0;
  result = result.replace(/(<[^/][^>]*[^/]>|<[^/][^>]*>(?!.*<\/))(?!.*\/>)|(<\/[^>]+>)/g, (match) => {
    if (match.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      return '\n' + '  '.repeat(indent) + match;
    } else {
      const tag = '\n' + '  '.repeat(indent) + match;
      indent++;
      return tag;
    }
  });
  return result.trim();
}
