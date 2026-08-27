import { YamlToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online YAML to JSON Converter',
  description: 'Free online YAML to JSON converter. Paste YAML and get JSON instantly. Instant YAML to JSON conversion.',
};

const page = () => <YamlToJson />;
export default page;
