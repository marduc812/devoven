import { DataUrlCreator } from '@/Components/Functions/DataUrlTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/data-url', {
  title: 'Data URL Creator | DevOven',
  description: 'Convert text to a base64-encoded data URL, or decode an existing data: URL to inspect its MIME type, encoding, and content.',
});

const page = () => <DataUrlCreator />;
export default page;
