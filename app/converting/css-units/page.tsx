import { CssUnitConverterTool } from '@/Components/Functions/CssUnitTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Unit Converter - DevOven',
  description: 'Convert CSS units between px, rem, em, pt, cm, mm, in, vw, and vh. Configure base font size and viewport dimensions. Instant CSS Unit conversion.',
};

const page = () => <CssUnitConverterTool />;
export default page;
