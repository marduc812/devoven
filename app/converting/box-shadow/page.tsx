import { BoxShadowGenerator } from '@/Components/Functions/BoxShadowTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/box-shadow', {
  title: 'Box Shadow Generator - DevOven',
  description: 'Generate CSS box-shadow values from simple key=value config. Support multiple shadow layers separated by semicolons. Includes 10 preset shadow styles.',
});

const page = () => <BoxShadowGenerator />;
export default page;
