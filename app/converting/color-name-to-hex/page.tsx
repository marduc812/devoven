import { ColorNameToHex } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Color Name to HEX Converter',
  description: 'Free online CSS color name to HEX converter. Type any CSS named color and get its hex code instantly. Instant CSS Color Name to HEX conversion.',
};

const page = () => <ColorNameToHex />;
export default page;
