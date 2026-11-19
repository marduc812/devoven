import type { Metadata } from 'next';

export const SITE_URL = 'https://www.devoven.com';

const MIN_DESCRIPTION = 120;
const MAX_DESCRIPTION = 160;
const DESCRIPTION_SUFFIXES = [
  ' A free online tool from DevOven that works right in your browser: no signup, no install, nothing to set up.',
  ' A free online tool from DevOven: no signup, no install, ready in your browser.',
  ' Free to use, with no signup, right in your browser.',
  ' Free to use, no signup required.',
];

/**
 * Bing flags meta descriptions that read as too short, and a lot of tool
 * descriptions are a single terse sentence. Pad those to a useful length with
 * a plain suffix, never past what a results page will show. Longer
 * hand-written descriptions pass through untouched.
 */
export function padDescription(description: string): string {
  if (description.length >= MIN_DESCRIPTION) return description;
  const base = /[.!?]$/.test(description) ? description : `${description}.`;
  const suffix = DESCRIPTION_SUFFIXES.find(s => base.length + s.length <= MAX_DESCRIPTION);
  return suffix ? base + suffix : description;
}

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
  const description = typeof meta.description === 'string' ? padDescription(meta.description) : meta.description;

  return {
    ...meta,
    description,
    alternates: { canonical: path, ...meta.alternates },
    openGraph: {
      title,
      description: description ?? undefined,
      url: path,
      siteName: 'DevOven',
      type: 'website',
      images: [{ url: '/images/og.png', width: 800, height: 600 }],
      ...meta.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: ['/images/og.png'],
      ...meta.twitter,
    },
  };
}
