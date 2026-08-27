import type { Metadata } from 'next';
import { TextRepeater } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Text Repeater | DevOven',
  description: 'Repeat any text N times with a custom separator. Supports newline, tab, or any other separator string.',
};

const page = () => <TextRepeater />;
export default page;
