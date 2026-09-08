import type { Metadata } from 'next';
import { PadLines } from '@/Components/Functions/TextCleanupTools';

export const metadata: Metadata = {
  title: 'Pad Lines | DevOven',
  description: 'Pad every line of text to the same width, on the left, the right or both sides, with any fill character. Free, in-browser, no upload.',
};

const page = () => {
  return <PadLines />;
};

export default page;
