import { TomlToYaml } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online TOML to YAML Converter',
  description: 'Free online TOML to YAML converter. Paste TOML and get YAML instantly. Instant TOML to YAML conversion.',
};

const page = () => <TomlToYaml />;
export default page;
