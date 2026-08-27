import { YamlToToml } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online YAML to TOML Converter',
  description: 'Free online YAML to TOML converter. Paste YAML and get TOML instantly. Instant YAML to TOML conversion.',
};

const page = () => <YamlToToml />;
export default page;
