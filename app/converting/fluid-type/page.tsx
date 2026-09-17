import { FluidTypeCalculator } from '@/Components/Functions/FluidTypeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/fluid-type', {
  title: 'Fluid Typography Calculator - DevOven',
  description: 'Generate CSS clamp() values for fluid typography. Enter min/max font sizes and viewport widths to get a responsive font-size that scales smoothly.',
});

const page = () => <FluidTypeCalculator />;
export default page;
