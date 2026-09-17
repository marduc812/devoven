import { UuidValidator } from '@/Components/Functions/DevTools4';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/uuid-validator', {
  title: 'UUID Validator | DevOven',
  description: 'Validate and inspect UUID strings. Detects UUID version, variant, and accepts various formats including without dashes.',
});

const page = () => <UuidValidator />;
export default page;
