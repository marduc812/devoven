import { ColorPaletteExtractor } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/color-palette-extractor', {
  title: 'Color Palette Extractor from Image',
  description: 'Free online color palette extractor. Upload any image and instantly get the dominant HEX color codes.',
});

const page = () => <ColorPaletteExtractor />;
export default page;
