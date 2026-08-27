export function base64ToMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'application/octet-stream';
}

export function isDataUri(str: string): boolean {
  return /^data:[^;]+;base64,/.test(str.trim());
}

export function stripDataUriPrefix(dataUri: string): string {
  return dataUri.replace(/^data:[^;]+;base64,/, '');
}

export function guessFilename(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'image.jpg',
    'image/png': 'image.png',
    'image/gif': 'image.gif',
    'image/webp': 'image.webp',
    'image/svg+xml': 'image.svg',
    'application/pdf': 'document.pdf',
    'text/plain': 'file.txt',
    'text/html': 'index.html',
    'text/css': 'styles.css',
    'application/json': 'data.json',
    'application/zip': 'archive.zip',
    'audio/mpeg': 'audio.mp3',
    'video/mp4': 'video.mp4',
  };
  return map[mimeType] ?? 'file.bin';
}

export function getBase64Stats(base64: string): string {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const bytes = Math.floor(clean.length * 3 / 4);
  const kb = (bytes / 1024).toFixed(2);
  return `Base64 length: ${clean.length} chars\nDecoded size:  ~${kb} KB (${bytes} bytes)`;
}
