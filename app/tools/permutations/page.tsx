import type { Metadata } from 'next';
import { PermutationCalculator } from '@/Components/Functions/PermutationsTools';

export const metadata: Metadata = {
  title: 'Permutation & Combination Calculator | DevOven',
  description: 'Calculate P(n,r) permutations and C(n,r) combinations with formulas and step-by-step results. Lists first 10 combinations for small inputs.',
};

export default function Page() {
  return <PermutationCalculator />;
}
