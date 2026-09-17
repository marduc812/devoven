import { TomlValidator } from '@/Components/Functions/TomlValidatorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/toml-validator', {
  title: 'Online TOML Validator',
  description: 'Free online TOML validator. Paste your TOML document to validate it and preview the parsed structure as JSON.',
});

const page = () => <TomlValidator />;
export default page;
