import type { Metadata } from 'next';
import { TextRepeater } from '@/Components/Functions/TextUtilities';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/text-repeater', {
  title: 'Text Repeater | DevOven',
  description: 'Repeat any text N times with a custom separator. Supports newline, tab, or any other separator string.',
});

const page = () => <TextRepeater />;
export default page;
