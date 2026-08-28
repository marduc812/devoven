import type { Metadata } from 'next';
import { K8sResourceCalculator } from '@/Components/Functions/K8sResourceCalcTools';

export const metadata: Metadata = {
  title: 'Kubernetes Resource Calculator | DevOven',
  description: 'Calculate Kubernetes container CPU and memory resources. Parse millicores, cores, MiB, GiB values, validate requests vs limits, determine QoS class, and estimate node fit.',
};

export default function Page() {
  return <K8sResourceCalculator />;
}
