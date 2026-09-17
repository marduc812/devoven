import { GitConfigParser } from '@/Components/Functions/GitConfigTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/git-config', {
  title: 'Git Config Parser - DevOven',
  description: 'Parse git config file format to JSON and convert JSON back to git config format.',
});

const page = () => <GitConfigParser />;
export default page;
