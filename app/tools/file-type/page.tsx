import { FileTypeDetector } from '@/Components/Functions/FileForensicsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detect File Type Online - Magic Number Checker | DevOven',
  description: 'Free online file type detector. Identify any file from its magic number instead of its extension, with the matching MIME type, category and hex preview. Runs entirely in your browser.',
};

const page = () => <FileTypeDetector />;
export default page;
