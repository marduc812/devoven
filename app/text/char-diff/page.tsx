import type { Metadata } from 'next';
import { CharDiff } from '@/Components/Functions/CharDiffTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/char-diff', {
  title: 'Text Diff Highlighter | DevOven',
  description: 'Compare two texts at word or character level. See additions marked as [+added+] and deletions as [-removed-]. Shows similarity percentage and change statistics.',
});

export default function Page() {
  return <CharDiff />;
}
