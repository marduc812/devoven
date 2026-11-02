import type { Metadata } from 'next';
import { CharDiff } from '@/Components/Functions/CharDiffTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/char-diff', {
  title: 'Text Diff Highlighter | DevOven',
  description: 'Compare two texts by word or character with highlighted additions and removals. Read inline or side-by-side diffs with similarity and change counts.',
});

export default function Page() {
  return <CharDiff />;
}
