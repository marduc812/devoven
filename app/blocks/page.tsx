import type { Metadata } from 'next';
import BlocksPage from '@/Components/Blocks/BlocksPage';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/blocks', {
  title: 'Blocks Builder | DevOven',
  description:
    'Build a chain of encoding, hashing, and conversion operations. Each block feeds its output into the next - create powerful data transformation blocks entirely in your browser.',
  keywords: ['block', 'encoding', 'hashing', 'base64', 'sha256', 'transform', 'developer tools'],
});

export default function Page() {
  return <BlocksPage />;
}
