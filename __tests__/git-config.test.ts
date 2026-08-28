import {
  gitConfigToJson,
  jsonToGitConfig,
} from '@/Components/Functions/GitConfigTools/logic';

const sampleGitConfig = `
[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false

[remote "origin"]
\turl = https://github.com/user/repo.git
\tfetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
`;

// ─── gitConfigToJson ──────────────────────────────────────────────────────────

describe('gitConfigToJson', () => {
  it('parses [core] section', () => {
    const obj = JSON.parse(gitConfigToJson(sampleGitConfig));
    expect(obj.core).toBeDefined();
    expect(obj.core.bare).toBe('false');
  });

  it('parses subsection [remote "origin"]', () => {
    const obj = JSON.parse(gitConfigToJson(sampleGitConfig));
    expect(obj['remote.origin']).toBeDefined();
    expect(obj['remote.origin'].url).toContain('github.com');
  });

  it('parses [branch "main"] subsection', () => {
    const obj = JSON.parse(gitConfigToJson(sampleGitConfig));
    expect(obj['branch.main']).toBeDefined();
    expect(obj['branch.main'].remote).toBe('origin');
  });

  it('ignores comment lines', () => {
    const cfg = `
# this is a comment
[core]
\tbare = false
; another comment
\tfilemode = true
`;
    const obj = JSON.parse(gitConfigToJson(cfg));
    expect(obj.core.bare).toBe('false');
    expect(obj.core.filemode).toBe('true');
  });

  it('ignores blank lines', () => {
    const obj = JSON.parse(gitConfigToJson(sampleGitConfig));
    expect(Object.keys(obj).length).toBeGreaterThanOrEqual(3);
  });

  it('returns valid JSON', () => {
    expect(() => JSON.parse(gitConfigToJson(sampleGitConfig))).not.toThrow();
  });
});

// ─── jsonToGitConfig ──────────────────────────────────────────────────────────

describe('jsonToGitConfig', () => {
  it('generates [section] headers for simple sections', () => {
    const json = JSON.stringify({ core: { bare: 'false', filemode: 'true' } });
    const cfg = jsonToGitConfig(json);
    expect(cfg).toContain('[core]');
  });

  it('generates [section "subsection"] for dotted keys', () => {
    const json = JSON.stringify({ 'remote.origin': { url: 'https://github.com/repo.git' } });
    const cfg = jsonToGitConfig(json);
    expect(cfg).toContain('[remote "origin"]');
  });

  it('writes key = value pairs with tab indent', () => {
    const json = JSON.stringify({ core: { bare: 'false' } });
    const cfg = jsonToGitConfig(json);
    expect(cfg).toContain('\tbare = false');
  });

  it('round-trips gitconfig → JSON → gitconfig', () => {
    const json = gitConfigToJson(sampleGitConfig);
    const roundtripped = jsonToGitConfig(json);
    expect(roundtripped).toContain('[core]');
    expect(roundtripped).toContain('[remote "origin"]');
  });

  it('throws on invalid JSON', () => {
    expect(() => jsonToGitConfig('not json')).toThrow();
  });
});
