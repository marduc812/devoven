import { EmbeddedFileScanner } from '@/Components/Functions/FileForensicsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan for Embedded Files Online - File Carving | DevOven',
  description: 'Free online embedded file scanner. Find files hidden inside other files by their magic numbers, see where each one starts and how long it runs, and download the carved bytes. Runs entirely in your browser.',
};

const page = () => <EmbeddedFileScanner />;
export default page;
