import { ZipCreator } from '@/Components/Functions/ArchiveTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create ZIP Online - Zip Files in Your Browser | DevOven',
  description: 'Free online ZIP creator. Pack any set of files into one archive with a choice of compression level, from store to maximum. Nothing is uploaded - the archive is built entirely in your browser.',
};

const page = () => <ZipCreator />;
export default page;
