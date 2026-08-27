import {
  generateShieldsUrl,
  generateMarkdownBadge,
  formatBadgeOutput,
  BADGE_PRESETS,
  type BadgeConfig,
} from '@/Components/Functions/BadgeGeneratorTools/logic';

const baseConfig: BadgeConfig = {
  label: 'build',
  message: 'passing',
  color: 'brightgreen',
  labelColor: '',
  style: 'flat',
  logo: '',
  link: '',
};

// ─── generateShieldsUrl ───────────────────────────────────────────────────────

describe('generateShieldsUrl', () => {
  it('generates basic URL with label-message-color', () => {
    const url = generateShieldsUrl(baseConfig);
    expect(url).toContain('https://img.shields.io/badge/');
    expect(url).toContain('brightgreen');
  });

  it('does not add style param when style is flat', () => {
    const url = generateShieldsUrl(baseConfig);
    expect(url).not.toContain('style=flat');
  });

  it('adds style param when style is not flat', () => {
    const url = generateShieldsUrl({ ...baseConfig, style: 'for-the-badge' });
    expect(url).toContain('style=for-the-badge');
  });

  it('adds logo param when logo is set', () => {
    const url = generateShieldsUrl({ ...baseConfig, logo: 'typescript' });
    expect(url).toContain('logo=typescript');
  });

  it('adds labelColor param when labelColor is set', () => {
    const url = generateShieldsUrl({ ...baseConfig, labelColor: '#333' });
    expect(url).toContain('labelColor=333');
  });

  it('strips # from color', () => {
    const url = generateShieldsUrl({ ...baseConfig, color: '#3178C6' });
    expect(url).toContain('3178C6');
    expect(url).not.toContain('#3178C6');
  });

  it('escapes hyphens in label with double dash', () => {
    const url = generateShieldsUrl({ ...baseConfig, label: 'my-label' });
    expect(url).toContain('my--label');
  });

  it('escapes underscores in message with double underscore', () => {
    const url = generateShieldsUrl({ ...baseConfig, message: 'v1_0' });
    expect(url).toContain('v1__0');
  });
});

// ─── generateMarkdownBadge ────────────────────────────────────────────────────

describe('generateMarkdownBadge', () => {
  it('generates markdown image syntax', () => {
    const md = generateMarkdownBadge(baseConfig);
    expect(md).toMatch(/^!\[.*\]\(.*\)$/);
  });

  it('wraps image in link when link is provided', () => {
    const md = generateMarkdownBadge({ ...baseConfig, link: 'https://example.com' });
    expect(md).toMatch(/^\[!\[.*\]\(.*\)\]\(https:\/\/example\.com\)$/);
  });

  it('does not wrap in link when link is empty', () => {
    const md = generateMarkdownBadge(baseConfig);
    expect(md).not.toContain('[!');
  });

  it('includes alt text with label and message', () => {
    const md = generateMarkdownBadge(baseConfig);
    expect(md).toContain('build: passing');
  });
});

// ─── formatBadgeOutput ───────────────────────────────────────────────────────

describe('formatBadgeOutput', () => {
  it('contains Markdown: section', () => {
    const out = formatBadgeOutput(baseConfig);
    expect(out).toContain('Markdown:');
  });

  it('contains Image URL: section', () => {
    const out = formatBadgeOutput(baseConfig);
    expect(out).toContain('Image URL:');
  });

  it('contains HTML: section with img tag', () => {
    const out = formatBadgeOutput(baseConfig);
    expect(out).toContain('HTML:');
    expect(out).toContain('<img src=');
  });

  it('HTML section has correct alt attribute', () => {
    const out = formatBadgeOutput(baseConfig);
    expect(out).toContain('alt="build: passing"');
  });
});

// ─── BADGE_PRESETS ───────────────────────────────────────────────────────────

describe('BADGE_PRESETS', () => {
  it('has at least 5 presets', () => {
    expect(BADGE_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('each preset has a name and config', () => {
    for (const preset of BADGE_PRESETS) {
      expect(typeof preset.name).toBe('string');
      expect(preset.config).toBeDefined();
    }
  });

  it('License MIT preset exists', () => {
    const preset = BADGE_PRESETS.find(p => p.name === 'License MIT');
    expect(preset).toBeDefined();
    expect(preset?.config.message).toBe('MIT');
  });
});
