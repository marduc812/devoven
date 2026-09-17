import { YamlToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/yaml-to-json', {
  title: 'Online YAML to JSON Converter',
  description: 'Free online YAML to JSON converter. Paste YAML and get JSON instantly. Instant YAML to JSON conversion.',
});

const page = () => <YamlToJson />;
export default page;
