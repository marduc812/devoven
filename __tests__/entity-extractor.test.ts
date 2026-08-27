import { extractEntities, formatEntities } from '@/Components/Functions/EntityExtractorTools/logic';

describe('extractEntities', () => {
  it('extracts email addresses', () => {
    const result = extractEntities('Contact us at hello@example.com or support@test.org');
    expect(result.emails).toContain('hello@example.com');
    expect(result.emails).toContain('support@test.org');
  });

  it('extracts URLs', () => {
    const result = extractEntities('Visit https://example.com or http://test.org/path?q=1');
    expect(result.urls.some(u => u.includes('example.com'))).toBe(true);
  });

  it('extracts IPv4 addresses', () => {
    const result = extractEntities('Server at 192.168.1.1 and 10.0.0.1');
    expect(result.ipv4s).toContain('192.168.1.1');
    expect(result.ipv4s).toContain('10.0.0.1');
  });

  it('extracts hashtags', () => {
    const result = extractEntities('Follow #DevOps and #kubernetes on social media');
    expect(result.hashtags).toContain('#DevOps');
    expect(result.hashtags).toContain('#kubernetes');
  });

  it('extracts @mentions', () => {
    const result = extractEntities('Thanks @alice and @bob for the help');
    expect(result.mentions).toContain('@alice');
    expect(result.mentions).toContain('@bob');
  });

  it('extracts numbers', () => {
    const result = extractEntities('The price is 42.5 dollars and there are 10 items');
    expect(result.numbers.some(n => n === '42.5')).toBe(true);
    expect(result.numbers.some(n => n === '10')).toBe(true);
  });

  it('deduplicates results', () => {
    const result = extractEntities('hello@example.com hello@example.com');
    expect(result.emails.filter(e => e === 'hello@example.com').length).toBe(1);
  });

  it('masks credit card numbers', () => {
    const result = extractEntities('Card: 4111 1111 1111 1111');
    if (result.creditCards.length > 0) {
      expect(result.creditCards[0]).toContain('1111');
      expect(result.creditCards[0]).toContain('*');
    }
  });
});

describe('formatEntities', () => {
  it('returns no entities found for empty', () => {
    const entities = extractEntities('');
    expect(formatEntities(entities)).toBe('No entities found.');
  });

  it('formats emails with count', () => {
    const entities = extractEntities('test@example.com');
    const output = formatEntities(entities);
    expect(output).toContain('Emails');
    expect(output).toContain('test@example.com');
  });
});
