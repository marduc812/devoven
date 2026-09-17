import { YamlToToml } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/yaml-to-toml', {
  title: 'Online YAML to TOML Converter',
  description: 'Free online YAML to TOML converter. Paste YAML and get TOML instantly. Instant YAML to TOML conversion.',
});

const page = () => <YamlToToml />;
export default page;
