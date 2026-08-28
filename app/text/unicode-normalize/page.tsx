import { UnicodeNormalizer } from '@/Components/Functions/UnicodeNormalizerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unicode Normalizer - DevOven',
  description: 'Normalize unicode text using NFC, NFD, NFKC, or NFKD normalization forms.',
};

const page = () => <UnicodeNormalizer />;
export default page;
