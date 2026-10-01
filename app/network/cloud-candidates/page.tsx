import { CloudCandidateTools } from '@/Components/Functions/CloudCandidateTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/cloud-candidates', {
  title: 'Azure Blob Candidate Generator',
  description: 'Generate likely Azure Blob container name candidates locally. No resource scanning or network requests.',
});

export default function Page() {
  return <CloudCandidateTools />;
}
