import type { Metadata } from 'next';
import { TextLevenshteinConverter } from '@/Components/Functions/TextLevenshteinTools';

export const metadata: Metadata = {
  title: 'Levenshtein Distance | DevOven',
  description: 'Calculate edit distance between two strings. Shows insertions, deletions, substitutions, similarity percentage, and the dynamic programming matrix.',
};

export default function Page() {
  return <TextLevenshteinConverter />;
}
