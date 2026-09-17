import type { Metadata } from 'next';
import { K8sResourceCalculator } from '@/Components/Functions/K8sResourceCalcTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/k8s-resources', {
  title: 'Kubernetes Resource Calculator | DevOven',
  description: 'Calculate Kubernetes container CPU and memory resources. Parse millicores, cores, MiB, GiB values, validate requests vs limits, determine QoS class, and estimate node fit.',
});

export default function Page() {
  return <K8sResourceCalculator />;
}
