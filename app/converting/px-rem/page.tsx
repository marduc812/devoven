import { CssValueConverters } from '@/Components/Functions/CssValueConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/px-rem', {
  title: 'Pixel to REM Converter - DevOven',
  description: 'Convert between CSS pixel and rem values with configurable base font size. Batch convert multiple values at once. Instant Pixel to REM conversion.',
});

const page = () => <CssValueConverters />;
export default page;
