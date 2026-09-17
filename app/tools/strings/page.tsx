import { StringsExtractor } from '@/Components/Functions/FileForensicsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/strings', {
  title: 'Strings - Extract Text From a Binary File Online | DevOven',
  description: 'Free online strings tool. Extract readable ASCII and UTF-16LE text from an executable, firmware image or any binary file, with a configurable minimum length. Runs entirely in your browser.',
});

const page = () => <StringsExtractor />;
export default page;
