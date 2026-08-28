import {
  parseWhois,
  formatWhoisSummary,
} from '@/Components/Functions/WhoisParserTools/logic';

const SAMPLE_WHOIS = `
% This is a comment
# Another comment

Domain Name: EXAMPLE.COM
Registrar: Example Registrar, Inc.
Creation Date: 1995-08-14T04:00:00Z
Updated Date: 2023-08-14T07:01:17Z
Registry Expiry Date: 2024-08-13T04:00:00Z
Registrant Organization: Example Inc.
Registrant Country: US
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
DNSSEC: unsigned
Domain Status: clientDeleteProhibited
`;

describe('parseWhois', () => {
  it('extracts Domain Name field', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(data['Domain Name']).toBe('EXAMPLE.COM');
  });

  it('extracts Registrar field', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(data['Registrar']).toBe('Example Registrar, Inc.');
  });

  it('extracts Creation Date field', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(data['Creation Date']).toBe('1995-08-14T04:00:00Z');
  });

  it('ignores comment lines starting with %', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(Object.keys(data)).not.toContain('% This is a comment');
  });

  it('ignores comment lines starting with #', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(Object.keys(data)).not.toContain('# Another comment');
  });

  it('keeps first occurrence of duplicate keys', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    expect(data['Name Server']).toBe('NS1.EXAMPLE.COM');
  });

  it('handles empty input', () => {
    const data = parseWhois('');
    expect(Object.keys(data)).toHaveLength(0);
  });

  it('handles lines without colons gracefully', () => {
    const data = parseWhois('just a line without colon\nKey: Value');
    expect(data['Key']).toBe('Value');
  });
});

describe('formatWhoisSummary', () => {
  it('includes Key Information section', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    const result = formatWhoisSummary(data);
    expect(result).toContain('=== Key Information ===');
  });

  it('includes All Fields section', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    const result = formatWhoisSummary(data);
    expect(result).toContain('=== All Fields ===');
  });

  it('places Domain Name in key information', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    const result = formatWhoisSummary(data);
    const keyInfoSection = result.split('=== All Fields ===')[0];
    expect(keyInfoSection).toContain('Domain Name');
  });

  it('includes field values in output', () => {
    const data = parseWhois(SAMPLE_WHOIS);
    const result = formatWhoisSummary(data);
    expect(result).toContain('EXAMPLE.COM');
  });

  it('handles empty data gracefully', () => {
    const result = formatWhoisSummary({});
    expect(result).toContain('=== Key Information ===');
    expect(result).toContain('=== All Fields ===');
  });
});
