import { textToDataUrl, parseDataUrl, processDataUrl } from '@/Components/Functions/DataUrlTools/logic';
describe('textToDataUrl', () => {
  it('creates a data URL', () => {
    const url = textToDataUrl('hello');
    expect(url).toMatch(/^data:text\/plain;base64,/);
  });
  it('encodes content in base64', () => {
    const url = textToDataUrl('hello');
    const encoded = url.split(',')[1];
    expect(Buffer.from(encoded, 'base64').toString()).toBe('hello');
  });
  it('uses provided MIME type', () => {
    expect(textToDataUrl('{}', 'application/json')).toContain('application/json');
  });
});
describe('parseDataUrl', () => {
  it('parses a text data URL', () => {
    const url = 'data:text/plain;base64,aGVsbG8=';
    const result = parseDataUrl(url);
    expect(result.mimeType).toBe('text/plain');
    expect(result.decoded).toBe('hello');
  });
  it('parses URL-encoded data', () => {
    const url = 'data:text/plain,Hello%20World';
    const result = parseDataUrl(url);
    expect(result.decoded).toBe('Hello World');
  });
  it('throws for invalid data URL', () => expect(() => parseDataUrl('not-a-data-url')).toThrow());
});
describe('processDataUrl', () => {
  it('converts plain text to data URL', () => {
    const r = processDataUrl('hello world');
    expect(r).toMatch(/^data:/);
  });
  it('parses existing data URL', () => {
    const r = processDataUrl('data:text/plain;base64,aGVsbG8=');
    expect(r).toContain('MIME type:');
    expect(r).toContain('hello');
  });
});
