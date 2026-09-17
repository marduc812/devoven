import type { Metadata } from 'next';
import { HashLengthExtReference } from '@/Components/Functions/HashLengthExtTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/hash-length-ext', {
  title: 'Hash Length Extension Attack Reference | DevOven',
  description: 'Educational reference for hash length extension attacks. Learn which algorithms are vulnerable (MD5, SHA-1, SHA-256, SHA-512), how the Merkle-Damgård construction enables attacks, and how to defend with HMAC or SHA-3.',
});

export default function Page() {
  return <HashLengthExtReference />;
}
