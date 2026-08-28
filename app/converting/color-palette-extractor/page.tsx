import { ColorPaletteExtractor } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Palette Extractor from Image',
  description: 'Free online color palette extractor. Upload any image and instantly get the dominant HEX color codes.',
};

const page = () => <ColorPaletteExtractor />;
export default page;
