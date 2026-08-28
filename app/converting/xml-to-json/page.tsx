import { XmlJsonConverter } from '@/Components/Functions/XmlJsonTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online XML to JSON Converter',
  description: 'Free online XML to JSON converter. Paste XML and get JSON instantly. Instant XML to JSON conversion.',
};

const page = () => <XmlJsonConverter />;
export default page;
