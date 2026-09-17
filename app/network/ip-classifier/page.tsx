import { IpClassifier } from '@/Components/Functions/NetworkTools2';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/ip-classifier', {
  title: 'IP Address Classifier - DevOven',
  description: 'Classify an IPv4 address as private (Class A/B/C), loopback, link-local, multicast, broadcast, reserved, or public.',
});

const page = () => <IpClassifier />;
export default page;
