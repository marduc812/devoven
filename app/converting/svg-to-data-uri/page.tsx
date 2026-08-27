import { SvgToDataUri } from '@/Components/Functions/ExtraConverters2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVG to Data URI - DevOven',
  description: 'Convert SVG markup to a CSS-embeddable data URI. Supports URL-encoded and Base64 output formats.',
};

const page = () => <SvgToDataUri />;
export default page;
