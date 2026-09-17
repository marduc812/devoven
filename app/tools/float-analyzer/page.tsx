import { FloatAnalyzer } from '@/Components/Functions/FloatAnalyzerTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/float-analyzer', {
  title: 'IEEE 754 Float Analyzer - DevOven',
  description: 'Analyze the IEEE 754 floating-point binary representation of any decimal number. Shows sign bit, exponent, mantissa, exact stored value, and rounding error for 32-bit and 64-bit.',
});

const page = () => <FloatAnalyzer />;
export default page;
