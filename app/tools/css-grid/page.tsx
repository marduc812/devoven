import type { Metadata } from 'next';
import { CssGridGenerator } from '@/Components/Functions/CssGridTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/css-grid', {
  title: 'CSS Grid Generator | DevOven',
  description: 'Generate CSS Grid code from a description. Browse Holy Grail, Sidebar, Card Grid, Magazine, and Dashboard layout patterns with responsive variants.',
});

export default function Page() {
  return <CssGridGenerator />;
}
