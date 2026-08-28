import { TomlToJson } from '@/Components/Functions/TomlToJsonTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online TOML to JSON Converter',
  description: 'Free online TOML to JSON converter. Paste TOML and get formatted JSON instantly. Supports all common TOML types. Instant TOML to JSON conversion.',
};

const page = () => <TomlToJson />;
export default page;
