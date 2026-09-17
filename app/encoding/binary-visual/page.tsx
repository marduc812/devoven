import { BinaryVisual } from '@/Components/Functions/BinaryVisualTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/encoding/binary-visual', { title: 'Binary Visual', description: 'Visualize text as 8-bit binary patterns, or decode binary back to text. Each character shown as a bit grid.' });
const page = () => <BinaryVisual />;
export default page;
