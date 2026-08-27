import { REPOSITORY_URL, THIRD_PARTY_LIBRARIES } from '@/lib/third-party-licenses';

// The /open-source page is how the site meets AGPL section 13 and credits the
// libraries it ships. A dependency added to package.json without a line here
// would go uncredited, so the two lists have to stay in step.
const dependencies = Object.keys(
  (require('../package.json') as { dependencies: Record<string, string> }).dependencies,
);

describe('third-party licenses', () => {
  it('lists every runtime dependency', () => {
    const listed = new Set(THIRD_PARTY_LIBRARIES.map((l) => l.name));
    const missing = dependencies.filter((name) => !listed.has(name));
    expect(missing).toEqual([]);
  });

  it('lists nothing that is not a runtime dependency', () => {
    const declared = new Set(dependencies);
    const extra = THIRD_PARTY_LIBRARIES.filter((l) => !declared.has(l.name)).map((l) => l.name);
    expect(extra).toEqual([]);
  });

  it('names each library only once', () => {
    const names = THIRD_PARTY_LIBRARIES.map((l) => l.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every library a license, a description and an https link', () => {
    for (const library of THIRD_PARTY_LIBRARIES) {
      expect(library.license.trim()).not.toBe('');
      expect(library.used.trim()).not.toBe('');
      expect(library.url).toMatch(/^https:\/\//);
    }
  });

  it('points at a repository over https', () => {
    expect(REPOSITORY_URL).toMatch(/^https:\/\//);
  });
});
