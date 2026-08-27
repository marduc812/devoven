import type { Metadata } from 'next';
import { EnvValidator } from '@/Components/Functions/EnvValidatorTools';

export const metadata: Metadata = {
  title: 'Environment Variable Validator | DevOven',
  description: 'Validate .env file contents — checks syntax, spaces in keys, missing quotes, duplicate keys, and exposed secret patterns (API_KEY, SECRET, PASSWORD).',
};

export default function Page() {
  return <EnvValidator />;
}
