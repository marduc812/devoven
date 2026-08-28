const baseUrl = 'https://www.devoven.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}