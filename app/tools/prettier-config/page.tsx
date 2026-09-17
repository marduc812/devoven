import { PrettierConfigGenerator } from '@/Components/Functions/PrettierConfigTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/prettier-config', {
  title: 'Prettier Config Generator | DevOven',
  description: 'Generate a .prettierrc JSON configuration by selecting formatting preferences: tabs or spaces, line width, semicolons, quotes, trailing commas, and more.',
});

const page = () => <PrettierConfigGenerator />;
export default page;
