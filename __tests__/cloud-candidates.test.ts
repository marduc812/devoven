import { buildAzureContainerUrl, generateAzureContainerCandidates } from '@/Components/Functions/CloudCandidateTools/logic';

describe('generateAzureContainerCandidates', () => {
  it('normalizes a domain and returns useful deterministic variants', () => {
    expect(generateAzureContainerCandidates('https://www.Contoso.com')).toEqual(expect.arrayContaining([
      'contoso', 'contoso-dev', 'contosoprod', 'assets-contoso',
    ]));
  });

  it('deduplicates candidates and never exceeds the configured small output', () => {
    const result = generateAzureContainerCandidates('alpha beta');
    expect(result.length).toBeLessThanOrEqual(200);
    expect(new Set(result).size).toBe(result.length);
  });

  it('rejects empty or unusable input', () => {
    expect(() => generateAzureContainerCandidates('  ')).toThrow('Enter a company');
    expect(() => generateAzureContainerCandidates('---')).toThrow('letters or numbers');
  });
});

describe('buildAzureContainerUrl', () => {
  it('builds the standard blob endpoint', () => {
    expect(buildAzureContainerUrl('Contoso123', 'assets-prod')).toBe(
      'https://contoso123.blob.core.windows.net/assets-prod',
    );
  });

  it('rejects invalid account and container names', () => {
    expect(() => buildAzureContainerUrl('bad-name', 'assets')).toThrow('storage account');
    expect(() => buildAzureContainerUrl('contoso', 'bad--name')).toThrow('Container names');
  });
});
