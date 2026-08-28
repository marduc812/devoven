import { HammingDistance } from '@/Components/Functions/HammingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hamming Distance | DevOven',
  description: 'Calculate the Hamming distance between two equal-length strings. See position differences, similarity percentage, and binary XOR for bit strings.',
};

const page = () => <HammingDistance />;
export default page;
