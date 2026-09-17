import { BorderRadiusGenerator } from '@/Components/Functions/DevTools4';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/border-radius', {
  title: 'CSS Border Radius Generator | DevOven',
  description: 'Generate complex CSS border-radius values with per-corner control. Supports px and % units with a live preview.',
});

const page = () => <BorderRadiusGenerator />;
export default page;
