import { generateMetaTags, getDefaultMetaConfig, MetaConfig } from '../Components/Functions/MetaTagsTools/logic';

const baseConfig: MetaConfig = {
  title: 'Test Page',
  description: 'A test description',
  url: 'https://example.com/test',
  image: 'https://example.com/image.png',
  siteName: 'Test Site',
  twitterHandle: '@testhandle',
  type: 'website',
  locale: 'en_US',
};

describe('generateMetaTags', () => {
  it('includes title tag', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('<title>Test Page</title>');
  });

  it('includes meta description', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('name="description" content="A test description"');
  });

  it('includes og:title', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('property="og:title"');
    expect(output).toContain('Test Page');
  });

  it('includes og:type', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('og:type" content="website"');
  });

  it('includes og:url', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('og:url');
    expect(output).toContain('https://example.com/test');
  });

  it('includes og:image', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('og:image');
    expect(output).toContain('https://example.com/image.png');
  });

  it('includes og:site_name', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('og:site_name');
    expect(output).toContain('Test Site');
  });

  it('includes twitter card', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('twitter:card');
  });

  it('includes twitter site when handle provided', () => {
    const output = generateMetaTags(baseConfig);
    expect(output).toContain('twitter:site');
    expect(output).toContain('@testhandle');
  });

  it('omits twitter:site when handle is empty', () => {
    const config = { ...baseConfig, twitterHandle: '' };
    const output = generateMetaTags(config);
    expect(output).not.toContain('twitter:site');
  });

  it('escapes double quotes in content', () => {
    const config = { ...baseConfig, title: 'Say "Hello"' };
    const output = generateMetaTags(config);
    expect(output).toContain('&quot;');
    expect(output).not.toContain('content="Say "Hello"');
  });

  it('handles article type', () => {
    const config = { ...baseConfig, type: 'article' as const };
    const output = generateMetaTags(config);
    expect(output).toContain('og:type" content="article"');
  });
});

describe('getDefaultMetaConfig', () => {
  it('returns a complete config object', () => {
    const config = getDefaultMetaConfig();
    expect(config.title).toBeTruthy();
    expect(config.description).toBeTruthy();
    expect(config.url).toBeTruthy();
    expect(config.image).toBeTruthy();
    expect(config.siteName).toBeTruthy();
    expect(config.locale).toBeTruthy();
    expect(['website', 'article']).toContain(config.type);
  });
});
