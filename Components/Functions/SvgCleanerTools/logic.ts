export function cleanSvg(input: string): string {
  let result = input;

  // Remove XML declaration
  result = result.replace(/<\?xml[^?]*\?>\s*/g, '');

  // Remove comments
  result = result.replace(/<!--[\s\S]*?-->/g, '');

  // Remove empty lines
  result = result.replace(/^\s*[\r\n]/gm, '');

  // Remove title, desc, metadata elements
  result = result.replace(/<title>[^<]*<\/title>/g, '');
  result = result.replace(/<desc>[^<]*<\/desc>/g, '');
  result = result.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');

  // Remove data-* attributes
  result = result.replace(/\s+data-[a-z-]+=["'][^"']*["']/g, '');

  // Remove xml:space attribute
  result = result.replace(/\s+xml:space=["'][^"']*["']/g, '');

  // Remove empty defs
  result = result.replace(/<defs\s*\/>/g, '');
  result = result.replace(/<defs>\s*<\/defs>/g, '');

  // Simplify style attributes (basic: remove empty styles)
  result = result.replace(/\s+style=""/g, '');

  // Collapse multiple spaces in attributes
  result = result.replace(/\s{2,}/g, ' ');

  // Remove trailing whitespace
  result = result.replace(/[ \t]+$/gm, '');

  return result.trim();
}

export function getSvgStats(original: string, cleaned: string): string {
  const encoder = new TextEncoder();
  const origSize = encoder.encode(original).length;
  const cleanSize = encoder.encode(cleaned).length;
  const savings = origSize - cleanSize;
  const pct = origSize > 0 ? Math.round((savings / origSize) * 100) : 0;
  return `Original: ${origSize} bytes\nCleaned:  ${cleanSize} bytes\nSaved:    ${savings} bytes (${pct}%)`;
}
