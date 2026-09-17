import { UnicodeNormalizer } from '@/Components/Functions/UnicodeNormalizerTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/unicode-normalize', {
  title: 'Unicode Normalizer - DevOven',
  description: 'Normalize unicode text using NFC, NFD, NFKC, or NFKD normalization forms.',
});

const page = () => <UnicodeNormalizer />;
export default page;
