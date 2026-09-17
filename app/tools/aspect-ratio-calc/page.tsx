import type { Metadata } from 'next';
import { AspectRatioCalc } from '@/Components/Functions/AspectRatioCalcTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/aspect-ratio-calc', {
  title: 'Aspect Ratio Calculator — Breakpoints & Common Names | DevOven',
  description: 'Calculate aspect ratios with common name recognition (16:9, 4:3), equivalent pixel sizes at common breakpoints, and missing dimension finder.',
});

export default function Page() {
  return <AspectRatioCalc />;
}
