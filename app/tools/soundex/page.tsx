import { SoundexConverter } from '@/Components/Functions/SoundexTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/soundex', {
  title: 'Soundex Code - DevOven',
  description: 'Generate Soundex phonetic codes for names. Similar-sounding names produce the same code, useful for name matching and genealogy.',
});

const page = () => <SoundexConverter />;
export default page;
