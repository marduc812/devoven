import { HexViewer } from '@/Components/Functions/HexViewerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hex Viewer / Hex Dump - Text to Hex Online',
  description: 'Convert text to a hex dump display similar to xxd output. View byte offsets, hex values, and ASCII representation side by side.',
};

const page = () => <HexViewer />;
export default page;
