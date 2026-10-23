import { inspectSourceMap } from '@/Components/Functions/SourceMapInspector/logic';

describe('source map inspector', () => {
  it('finds endpoints, URLs, and credentials with locations', () => {
    const input = JSON.stringify({
      version: 3,
      sourceRoot: 'webpack:///app/',
      sources: ['src/client.ts', 'src/empty.ts'],
      sourcesContent: [
        [
          'fetch("/api/users");',
          'const apiKey = "a1b2c3d4e5f6g7h8";',
          'const config = {"secret":"s3cr3t-value-98765"};',
          'const docs = "https://example.com/docs";',
          'const fixture = "./fixtures/user.json";',
        ].join('\n'),
        null,
      ],
    });

    const result = inspectSourceMap(input);
    expect(result.sourceCount).toBe(2);
    expect(result.contentCount).toBe(1);
    expect(result.applicationSources).toEqual(['webpack:///app/src/client.ts', 'webpack:///app/src/empty.ts']);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'Path', value: '/api/users', line: 1 }),
      expect.objectContaining({ kind: 'Secret', value: 'a1b2c3d4e5f6g7h8', line: 2 }),
      expect.objectContaining({ kind: 'Secret', value: 's3cr3t-value-98765', line: 3 }),
      expect.objectContaining({ kind: 'URL', value: 'https://example.com/docs', line: 4 }),
      expect.objectContaining({ kind: 'Path', value: './fixtures/user.json', line: 5 }),
    ]));
    expect(result.findings.filter((finding) => finding.value === 'https://example.com/docs')).toHaveLength(1);
    expect(result.findings.some((finding) => finding.label === 'Source file')).toBe(false);
  });

  it('detects prefixed secrets while ignoring example assignments', () => {
    const token = `AKIA${'A'.repeat(16)}`;
    const result = inspectSourceMap(JSON.stringify({
      sources: ['config.js'],
      sourcesContent: [`const key = '${token}';\nconst password = 'changeme123';`],
    }));
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'Secret', label: 'AWS access key ID', value: token, line: 1 }),
    ]));
    expect(result.findings.some((finding) => finding.value === 'changeme123')).toBe(false);
  });

  it('rejects invalid JSON and JSON without a sources array', () => {
    expect(() => inspectSourceMap('{')).toThrow('valid JSON source map');
    expect(() => inspectSourceMap('{}')).toThrow('"sources" array');
  });

  it('accepts a source map larger than 15 MB', () => {
    const input = JSON.stringify({
      sources: ['large.js'],
      sourcesContent: ['a'.repeat(15 * 1024 * 1024)],
    });
    expect(input.length).toBeGreaterThan(15 * 1024 * 1024);
    const result = inspectSourceMap(input);
    expect(result.sourceCount).toBe(1);
    expect(result.applicationSources).toEqual(['large.js']);
    expect(result.findings).toEqual([]);
  });

});
