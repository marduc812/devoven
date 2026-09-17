import type { Metadata } from 'next';
import { TextDiff } from '@/Components/Functions/TextDiffTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/diff-viewer', {
  title: 'Diff Viewer | DevOven',
  description: 'Compare two text blocks line by line using LCS-based diff algorithm. Shows added, removed, and unchanged lines in unified diff format.',
});

export default function Page() {
  return <TextDiff />;
}
