import type { Metadata } from 'next';
import { CloudCostEstimator } from '@/Components/Functions/CloudCostTools';

export const metadata: Metadata = {
  title: 'Cloud Cost Estimator | DevOven',
  description: 'Estimate monthly cloud costs for AWS, GCP, and Azure from a plain-text workload description. Shows compute, storage, and transfer cost breakdowns based on 2024 public pricing.',
};

export default function Page() {
  return <CloudCostEstimator />;
}
