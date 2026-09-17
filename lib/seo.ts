import type { Metadata } from 'next';

export const SITE_URL = 'https://www.devoven.com';

/**
 * Adds the two things Next will not infer for a tool page.
 *
 * A self-referencing canonical, because every tool mints `?from=...` share
 * links and those are the same page. And an Open Graph block of its own:
 * `openGraph` is inherited wholesale from the root layout when a page omits
 * it, so without this every tool shared as a link read "DevOven".
 */
export function toolMetadata(path: string, meta: Metadata): Metadata {
  const title = typeof meta.title === 'string' ? meta.title : undefined;

  return {
    ...meta,
    alternates: { canonical: path, ...meta.alternates },
    openGraph: {
      title,
      description: meta.description ?? undefined,
      url: path,
      siteName: 'DevOven',
      type: 'website',
      images: [{ url: '/images/og.png', width: 800, height: 600 }],
      ...meta.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: meta.description ?? undefined,
      images: ['/images/og.png'],
      ...meta.twitter,
    },
  };
}
