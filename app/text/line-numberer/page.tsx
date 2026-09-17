import type { Metadata } from 'next';
import { LineNumberer } from '@/Components/Functions/TextTools2';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/line-numberer', {
  title: 'Line Numberer | DevOven',
  description: 'Add or remove line numbers from text instantly in your browser.',
});

const page = () => {
  return <LineNumberer />;
};

export default page;
