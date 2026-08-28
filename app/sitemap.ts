import { menu } from '@/menu';

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export default function sitemap(): SitemapEntry[] {
  const baseUrl = 'https://www.devoven.com';
  const defaultChangeFreq: SitemapEntry['changeFrequency'] = 'monthly';
  const defaultPriority = 0.5;

  const sitemapEntries: SitemapEntry[] = menu.flatMap(group =>
    group.links.map(link => ({
      url: `${baseUrl}${link.link}`,
      lastModified: new Date().toISOString(), // converting Date object to ISO string format
      changeFrequency: link.tag === 'popular' ? 'weekly' : defaultChangeFreq,
      priority: link.tag === 'popular' ? 0.8 : defaultPriority,
    }))
  );

  const baseUrlEntry: SitemapEntry = {
    url: baseUrl,
    lastModified: new Date().toISOString(),
    changeFrequency: 'yearly',
    priority: 1,
  };

  return [baseUrlEntry, ...sitemapEntries];
}
