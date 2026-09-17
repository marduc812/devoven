import { XmlJsonConverter } from '@/Components/Functions/XmlJsonTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/xml-to-json', {
  title: 'Online XML to JSON Converter',
  description: 'Free online XML to JSON converter. Paste XML and get JSON instantly. Instant XML to JSON conversion.',
});

const page = () => <XmlJsonConverter />;
export default page;
