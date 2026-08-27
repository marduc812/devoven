export type ContentTypeEntry = {
  keys: string[];
  mediaType: string;
  charset?: string;
  notes: string;
};

export const CONTENT_TYPE_MAP: ContentTypeEntry[] = [
  // Text
  { keys: ['html', 'htm'], mediaType: 'text/html', charset: 'utf-8', notes: 'HTML documents' },
  { keys: ['css'], mediaType: 'text/css', charset: 'utf-8', notes: 'Cascading Style Sheets' },
  { keys: ['csv'], mediaType: 'text/csv', charset: 'utf-8', notes: 'Comma-separated values' },
  { keys: ['txt', 'text', 'plain'], mediaType: 'text/plain', charset: 'utf-8', notes: 'Plain text' },
  { keys: ['xml'], mediaType: 'text/xml', charset: 'utf-8', notes: 'XML documents (text)' },
  { keys: ['calendar', 'ics'], mediaType: 'text/calendar', charset: 'utf-8', notes: 'iCalendar format' },
  { keys: ['vcard', 'vcf'], mediaType: 'text/vcard', charset: 'utf-8', notes: 'vCard contact data' },
  { keys: ['markdown', 'md'], mediaType: 'text/markdown', charset: 'utf-8', notes: 'Markdown text' },
  { keys: ['yaml', 'yml'], mediaType: 'application/yaml', charset: 'utf-8', notes: 'YAML documents' },
  { keys: ['rtf'], mediaType: 'application/rtf', notes: 'Rich Text Format' },
  { keys: ['ini', 'cfg', 'conf'], mediaType: 'text/plain', charset: 'utf-8', notes: 'Configuration / INI files (plain text)' },
  { keys: ['log'], mediaType: 'text/plain', charset: 'utf-8', notes: 'Log files' },

  // Application
  { keys: ['json'], mediaType: 'application/json', charset: 'utf-8', notes: 'JSON data' },
  { keys: ['jsonld', 'json-ld', 'jsonld'], mediaType: 'application/ld+json', charset: 'utf-8', notes: 'JSON-LD linked data' },
  { keys: ['ndjson', 'jsonl'], mediaType: 'application/x-ndjson', notes: 'Newline-delimited JSON' },
  { keys: ['application/xml', 'appxml'], mediaType: 'application/xml', charset: 'utf-8', notes: 'XML (application type)' },
  { keys: ['pdf'], mediaType: 'application/pdf', notes: 'PDF documents' },
  { keys: ['zip'], mediaType: 'application/zip', notes: 'ZIP archive' },
  { keys: ['gzip', 'gz'], mediaType: 'application/gzip', notes: 'Gzip compressed' },
  { keys: ['bzip2', 'bz2'], mediaType: 'application/x-bzip2', notes: 'Bzip2 compressed' },
  { keys: ['tar'], mediaType: 'application/x-tar', notes: 'TAR archive' },
  { keys: ['7z', '7zip'], mediaType: 'application/x-7z-compressed', notes: '7-Zip archive' },
  { keys: ['rar'], mediaType: 'application/vnd.rar', notes: 'RAR archive' },
  { keys: ['form', 'urlencoded', 'form-urlencoded'], mediaType: 'application/x-www-form-urlencoded', notes: 'HTML form URL-encoded data' },
  { keys: ['multipart', 'form-data', 'multipart-form', 'formdata'], mediaType: 'multipart/form-data', notes: 'Multipart form data (file uploads)' },
  { keys: ['multipart-mixed', 'mixed'], mediaType: 'multipart/mixed', notes: 'Multipart mixed body' },
  { keys: ['octet', 'binary', 'octet-stream', 'blob'], mediaType: 'application/octet-stream', notes: 'Arbitrary binary data / download' },
  { keys: ['wasm'], mediaType: 'application/wasm', notes: 'WebAssembly binary' },
  { keys: ['js', 'javascript', 'mjs'], mediaType: 'application/javascript', charset: 'utf-8', notes: 'JavaScript module or script' },
  { keys: ['ts', 'typescript'], mediaType: 'application/typescript', charset: 'utf-8', notes: 'TypeScript source (non-standard)' },
  { keys: ['graphql'], mediaType: 'application/graphql', charset: 'utf-8', notes: 'GraphQL query body' },
  { keys: ['protobuf', 'proto'], mediaType: 'application/protobuf', notes: 'Protocol Buffers binary' },
  { keys: ['msgpack', 'messagepack'], mediaType: 'application/msgpack', notes: 'MessagePack binary format' },
  { keys: ['cbor'], mediaType: 'application/cbor', notes: 'CBOR binary format (RFC 7049)' },
  { keys: ['jwt'], mediaType: 'application/jwt', notes: 'JSON Web Token' },
  { keys: ['jose', 'jose+json'], mediaType: 'application/jose+json', notes: 'JOSE JSON serialization' },
  { keys: ['jrd', 'webfinger'], mediaType: 'application/jrd+json', notes: 'JRD/WebFinger JSON' },
  { keys: ['epub'], mediaType: 'application/epub+zip', notes: 'EPUB e-book' },
  { keys: ['doc', 'msword'], mediaType: 'application/msword', notes: 'Microsoft Word (legacy .doc)' },
  { keys: ['docx'], mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', notes: 'Microsoft Word (.docx)' },
  { keys: ['xlsx'], mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', notes: 'Microsoft Excel (.xlsx)' },
  { keys: ['xls'], mediaType: 'application/vnd.ms-excel', notes: 'Microsoft Excel (legacy .xls)' },
  { keys: ['pptx'], mediaType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', notes: 'Microsoft PowerPoint (.pptx)' },
  { keys: ['odt'], mediaType: 'application/vnd.oasis.opendocument.text', notes: 'OpenDocument text' },
  { keys: ['ods'], mediaType: 'application/vnd.oasis.opendocument.spreadsheet', notes: 'OpenDocument spreadsheet' },
  { keys: ['patch', 'diff'], mediaType: 'text/x-diff', charset: 'utf-8', notes: 'Unified diff / patch file' },
  { keys: ['sql'], mediaType: 'application/sql', charset: 'utf-8', notes: 'SQL script' },
  { keys: ['woff'], mediaType: 'font/woff', notes: 'Web Open Font Format' },
  { keys: ['woff2'], mediaType: 'font/woff2', notes: 'Web Open Font Format 2' },
  { keys: ['ttf'], mediaType: 'font/ttf', notes: 'TrueType Font' },
  { keys: ['otf'], mediaType: 'font/otf', notes: 'OpenType Font' },

  // Images
  { keys: ['png'], mediaType: 'image/png', notes: 'PNG image' },
  { keys: ['jpg', 'jpeg'], mediaType: 'image/jpeg', notes: 'JPEG image' },
  { keys: ['gif'], mediaType: 'image/gif', notes: 'GIF image' },
  { keys: ['webp'], mediaType: 'image/webp', notes: 'WebP image' },
  { keys: ['svg', 'svg+xml'], mediaType: 'image/svg+xml', charset: 'utf-8', notes: 'SVG vector image' },
  { keys: ['ico', 'icon'], mediaType: 'image/x-icon', notes: 'ICO icon' },
  { keys: ['bmp'], mediaType: 'image/bmp', notes: 'BMP bitmap image' },
  { keys: ['tiff', 'tif'], mediaType: 'image/tiff', notes: 'TIFF image' },
  { keys: ['avif'], mediaType: 'image/avif', notes: 'AVIF image' },
  { keys: ['heic'], mediaType: 'image/heic', notes: 'HEIC image' },
  { keys: ['heif'], mediaType: 'image/heif', notes: 'HEIF image' },

  // Audio
  { keys: ['mp3'], mediaType: 'audio/mpeg', notes: 'MP3 audio' },
  { keys: ['ogg', 'oga'], mediaType: 'audio/ogg', notes: 'Ogg audio' },
  { keys: ['wav'], mediaType: 'audio/wav', notes: 'WAV audio' },
  { keys: ['flac'], mediaType: 'audio/flac', notes: 'FLAC audio' },
  { keys: ['aac'], mediaType: 'audio/aac', notes: 'AAC audio' },
  { keys: ['opus'], mediaType: 'audio/opus', notes: 'Opus audio' },
  { keys: ['webm-audio', 'weba'], mediaType: 'audio/webm', notes: 'WebM audio' },
  { keys: ['m4a'], mediaType: 'audio/mp4', notes: 'AAC in MP4 container' },

  // Video
  { keys: ['mp4', 'mpeg4'], mediaType: 'video/mp4', notes: 'MP4 video' },
  { keys: ['webm'], mediaType: 'video/webm', notes: 'WebM video' },
  { keys: ['ogv'], mediaType: 'video/ogg', notes: 'Ogg video' },
  { keys: ['mov', 'quicktime'], mediaType: 'video/quicktime', notes: 'QuickTime video' },
  { keys: ['avi'], mediaType: 'video/x-msvideo', notes: 'AVI video' },
  { keys: ['mkv', 'matroska'], mediaType: 'video/x-matroska', notes: 'Matroska / MKV video' },
  { keys: ['ts-video', 'mpegts'], mediaType: 'video/mp2t', notes: 'MPEG-TS transport stream' },
  { keys: ['m3u8', 'hls'], mediaType: 'application/vnd.apple.mpegurl', notes: 'HLS playlist (m3u8)' },
  { keys: ['dash', 'mpd'], mediaType: 'application/dash+xml', notes: 'DASH manifest (MPD)' },

  // Misc
  { keys: ['ndjson-events', 'event-stream', 'sse'], mediaType: 'text/event-stream', charset: 'utf-8', notes: 'Server-Sent Events (SSE)' },
  { keys: ['multipart-byteranges'], mediaType: 'multipart/byteranges', notes: 'Multipart byte ranges (partial content)' },
  { keys: ['pem', 'certificate'], mediaType: 'application/x-pem-file', notes: 'PEM-encoded certificate or key' },
  { keys: ['der'], mediaType: 'application/x-x509-ca-cert', notes: 'DER-encoded X.509 certificate' },
  { keys: ['p12', 'pfx'], mediaType: 'application/x-pkcs12', notes: 'PKCS#12 certificate bundle' },
  { keys: ['csr'], mediaType: 'application/pkcs10', notes: 'Certificate Signing Request' },
];

// Build lookup map
const LOOKUP: Record<string, ContentTypeEntry> = {};
for (const entry of CONTENT_TYPE_MAP) {
  for (const key of entry.keys) {
    LOOKUP[key.toLowerCase()] = entry;
  }
}

export type ContentTypeResult = {
  mediaType: string;
  fullHeader: string;
  boundary?: string;
  charset?: string;
  notes: string;
};

export function generateBoundary(): string {
  // Use Math.random for consistent, no-crypto approach
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '----WebKitFormBoundary';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function buildContentType(input: string): ContentTypeResult | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;

  const entry = LOOKUP[q];
  if (!entry) return null;

  const isMultipart = entry.mediaType.startsWith('multipart/');
  const boundary = isMultipart ? generateBoundary() : undefined;

  let fullHeader = entry.mediaType;
  if (entry.charset) fullHeader += '; charset=' + entry.charset;
  if (boundary) fullHeader += '; boundary=' + boundary;

  return {
    mediaType: entry.mediaType,
    fullHeader,
    boundary,
    charset: entry.charset,
    notes: entry.notes,
  };
}

export type ParsedContentType = {
  mediaType: string;
  subtype: string;
  charset?: string;
  boundary?: string;
  extra: Record<string, string>;
};

export function parseContentTypeHeader(header: string): ParsedContentType | null {
  const trimmed = header.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(';').map(s => s.trim());
  if (parts.length === 0) return null;

  const [mediaType] = parts;
  const slashIdx = mediaType.indexOf('/');
  if (slashIdx === -1) return null;

  const subtype = mediaType.slice(slashIdx + 1);
  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx === -1) continue;
    const k = parts[i].slice(0, eqIdx).trim().toLowerCase();
    let v = parts[i].slice(eqIdx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    params[k] = v;
  }

  return {
    mediaType: mediaType.toLowerCase(),
    subtype,
    charset: params['charset'],
    boundary: params['boundary'],
    extra: params,
  };
}

export function searchContentTypes(query: string): ContentTypeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CONTENT_TYPE_MAP.slice(0, 20);
  return CONTENT_TYPE_MAP.filter(e =>
    e.keys.some(k => k.includes(q)) ||
    e.mediaType.toLowerCase().includes(q) ||
    e.notes.toLowerCase().includes(q)
  );
}
