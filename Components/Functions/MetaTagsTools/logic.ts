export type MetaConfig = {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  twitterHandle: string;
  type: 'website' | 'article';
  locale: string;
};

export function generateMetaTags(config: MetaConfig): string {
  const escape = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const t = escape(config.title);
  const d = escape(config.description);
  const u = escape(config.url);
  const img = escape(config.image);
  const sn = escape(config.siteName);

  const lines: string[] = [
    '<!-- Primary Meta Tags -->',
    `<title>${config.title}</title>`,
    `<meta name="title" content="${t}">`,
    `<meta name="description" content="${d}">`,
    '',
    '<!-- Open Graph / Facebook -->',
    `<meta property="og:type" content="${config.type}">`,
    `<meta property="og:url" content="${u}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:site_name" content="${sn}">`,
    `<meta property="og:locale" content="${escape(config.locale)}">`,
    '',
    '<!-- Twitter -->',
    `<meta property="twitter:card" content="summary_large_image">`,
    `<meta property="twitter:url" content="${u}">`,
    `<meta property="twitter:title" content="${t}">`,
    `<meta property="twitter:description" content="${d}">`,
    `<meta property="twitter:image" content="${img}">`,
  ];

  if (config.twitterHandle) {
    lines.push(`<meta property="twitter:site" content="${escape(config.twitterHandle)}">`);
    lines.push(`<meta property="twitter:creator" content="${escape(config.twitterHandle)}">`);
  }

  return lines.join('\n');
}

export function getDefaultMetaConfig(): MetaConfig {
  return {
    title: 'My Page Title',
    description: 'A brief description of my page for search engines.',
    url: 'https://example.com/page',
    image: 'https://example.com/image.png',
    siteName: 'My Website',
    twitterHandle: '@myhandle',
    type: 'website',
    locale: 'en_US',
  };
}
