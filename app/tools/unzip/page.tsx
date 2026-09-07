import { ZipExtractor } from '@/Components/Functions/ArchiveTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extract ZIP Online - Unzip and List Archive Contents | DevOven',
  description: 'Free online ZIP and TAR extractor. List every entry with its packed and unpacked size, then download the files individually or all at once. Runs entirely in your browser, nothing is uploaded.',
};

const page = () => <ZipExtractor />;
export default page;
