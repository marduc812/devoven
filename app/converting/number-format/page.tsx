import { NumberFormatter } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-format', {
  title: 'Online Number Formatter',
  description: 'Format numbers with thousands separators, decimal places, and locale-specific styles.',
});

const page = () => <NumberFormatter />;
export default page;
