export function textToDataUrl(text: string, mimeType = 'text/plain'): string {
  const base64 = Buffer.from(text, 'utf-8').toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export function parseDataUrl(dataUrl: string): {
  mimeType: string;
  encoding: string;
  data: string;
  decoded?: string;
} {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;([^,]+))?,(.*)$/s);
  if (!match) throw new Error('Invalid data URL format');

  const mimeType = match[1] || 'text/plain';
  const encoding = match[2] || '';
  const data = match[3] || '';

  let decoded: string | undefined;
  if (encoding === 'base64') {
    try {
      decoded = Buffer.from(data, 'base64').toString('utf-8');
    } catch {
      decoded = undefined;
    }
  } else {
    decoded = decodeURIComponent(data);
  }

  return { mimeType, encoding, data, decoded };
}

export function processDataUrl(input: string): string {
  const trimmed = input.trim();

  if (trimmed.startsWith('data:')) {
    // Parse data URL
    const { mimeType, encoding, data, decoded } = parseDataUrl(trimmed);
    const sizeBytes = encoding === 'base64' ?
      Math.round((data.length * 3) / 4) :
      Buffer.byteLength(decodeURIComponent(data), 'utf-8');

    return [
      `MIME type:  ${mimeType}`,
      `Encoding:   ${encoding || 'URL-encoded'}`,
      `Data size:  ~${sizeBytes} bytes`,
      ``,
      decoded ? `=== Decoded Content ===\n${decoded.substring(0, 500)}${decoded.length > 500 ? '\n... (truncated)' : ''}` : '(binary data)',
    ].join('\n');
  }

  // Convert text to data URL
  return textToDataUrl(trimmed);
}
