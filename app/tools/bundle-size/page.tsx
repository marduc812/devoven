import type { Metadata } from 'next';
import { BundleSizeEstimator } from '@/Components/Functions/BundleSizeTools';

export const metadata: Metadata = {
  title: 'Bundle Size Estimator | DevOven',
  description: 'Estimate the minified and gzipped bundle size of npm packages. Includes 100+ popular packages with tree-shakeable flags, size bars, and optimization warnings.',
};

export default function Page() {
  return <BundleSizeEstimator />;
}
