import { BoxShadowGenerator } from '@/Components/Functions/DevTools4';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/box-shadow', {
  title: 'CSS Box Shadow Generator | DevOven',
  description: 'Generate CSS box-shadow values interactively. Add multiple layers, adjust offsets, blur, spread, color and inset.',
});

const page = () => <BoxShadowGenerator />;
export default page;
