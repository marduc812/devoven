import type { Metadata } from 'next';
import { CssGridGenerator } from '@/Components/Functions/CssGridTools';

export const metadata: Metadata = {
  title: 'CSS Grid Generator | DevOven',
  description: 'Generate CSS Grid code from a description. Browse Holy Grail, Sidebar, Card Grid, Magazine, and Dashboard layout patterns with responsive variants.',
};

export default function Page() {
  return <CssGridGenerator />;
}
