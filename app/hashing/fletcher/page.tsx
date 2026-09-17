import { FletcherChecksum } from '@/Components/Functions/FletcherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/fletcher', {
  title: 'Fletcher Checksum Calculator | DevOven',
  description: 'Free online Fletcher-16 and Fletcher-32 checksum calculator. Fast non-cryptographic checksums used in TCP and SCTP. Compares with Adler-32. Runs entirely in your browser.',
});

const page = () => <FletcherChecksum />;
export default page;
