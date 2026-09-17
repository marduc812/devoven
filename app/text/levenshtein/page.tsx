import type { Metadata } from 'next';
import { TextLevenshteinConverter } from '@/Components/Functions/TextLevenshteinTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/levenshtein', {
  title: 'Levenshtein Distance | DevOven',
  description: 'Calculate edit distance between two strings. Shows insertions, deletions, substitutions, similarity percentage, and the dynamic programming matrix.',
});

export default function Page() {
  return <TextLevenshteinConverter />;
}
