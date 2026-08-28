import { PrettierConfigGenerator } from '@/Components/Functions/PrettierConfigTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prettier Config Generator | DevOven',
  description: 'Generate a .prettierrc JSON configuration by selecting formatting preferences: tabs or spaces, line width, semicolons, quotes, trailing commas, and more.',
};

const page = () => <PrettierConfigGenerator />;
export default page;
