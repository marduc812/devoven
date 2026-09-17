import type { Metadata } from 'next';
import { ComplexityEstimator } from '@/Components/Functions/ComplexityTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/complexity', {
  title: 'Code Complexity Estimator | DevOven',
  description: 'Estimate cyclomatic complexity of any code snippet. Language-agnostic heuristic approach counting branches, loops, logical operators, and nesting depth.',
});

export default function Page() {
  return <ComplexityEstimator />;
}
