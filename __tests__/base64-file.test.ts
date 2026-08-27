import {
  base64ToMimeType,
  isDataUri,
  stripDataUriPrefix,
  guessFilename,
  getBase64Stats,
} from '@/Components/Functions/Base64FileTools/logic';

describe('isDataUri', () => {
  it('returns true for valid data URI', () => {
    expect(isDataUri('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('returns true for text/plain data URI', () => {
    expect(isDataUri('data:text/plain;base64,SGVsbG8=')).toBe(true);
  });

  it('returns true for application/pdf data URI', () => {
    expect(isDataUri('data:application/pdf;base64,JVBERi0=')).toBe(true);
  });

  it('returns false for plain base64 string', () => {
    expect(isDataUri('SGVsbG8gV29ybGQ=')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDataUri('')).toBe(false);
  });

  it('returns false for regular string', () => {
    expect(isDataUri('hello world')).toBe(false);
  });
});

describe('base64ToMimeType', () => {
  it('extracts image/png MIME type', () => {
    expect(base64ToMimeType('data:image/png;base64,abc=')).toBe('image/png');
  });

  it('extracts application/json MIME type', () => {
    expect(base64ToMimeType('data:application/json;base64,abc=')).toBe('application/json');
  });

  it('extracts text/plain MIME type', () => {
    expect(base64ToMimeType('data:text/plain;base64,abc=')).toBe('text/plain');
  });

  it('returns application/octet-stream for non-data-uri', () => {
    expect(base64ToMimeType('SGVsbG8=')).toBe('application/octet-stream');
  });

  it('returns application/octet-stream for empty string', () => {
    expect(base64ToMimeType('')).toBe('application/octet-stream');
  });
});

describe('stripDataUriPrefix', () => {
  it('strips data URI prefix from image', () => {
    const base64 = 'iVBORw0KGgo=';
    expect(stripDataUriPrefix(`data:image/png;base64,${base64}`)).toBe(base64);
  });

  it('strips data URI prefix from text', () => {
    const base64 = 'SGVsbG8=';
    expect(stripDataUriPrefix(`data:text/plain;base64,${base64}`)).toBe(base64);
  });

  it('returns plain base64 unchanged', () => {
    const base64 = 'SGVsbG8=';
    expect(stripDataUriPrefix(base64)).toBe(base64);
  });
});

describe('guessFilename', () => {
  it('returns image.png for image/png', () => {
    expect(guessFilename('image/png')).toBe('image.png');
  });

  it('returns document.pdf for application/pdf', () => {
    expect(guessFilename('application/pdf')).toBe('document.pdf');
  });

  it('returns file.txt for text/plain', () => {
    expect(guessFilename('text/plain')).toBe('file.txt');
  });

  it('returns data.json for application/json', () => {
    expect(guessFilename('application/json')).toBe('data.json');
  });

  it('returns file.bin for unknown MIME type', () => {
    expect(guessFilename('application/x-unknown')).toBe('file.bin');
  });
});

describe('getBase64Stats', () => {
  it('returns stats for plain base64', () => {
    // "Hello" in base64 = SGVsbG8=
    const result = getBase64Stats('SGVsbG8=');
    expect(result).toContain('Base64 length:');
    expect(result).toContain('Decoded size:');
  });

  it('returns stats for data URI', () => {
    const result = getBase64Stats('data:text/plain;base64,SGVsbG8=');
    expect(result).toContain('Base64 length:');
  });

  it('stats show correct base64 length', () => {
    const base64 = 'SGVsbG8='; // 8 chars
    const result = getBase64Stats(base64);
    expect(result).toContain('8 chars');
  });
});
