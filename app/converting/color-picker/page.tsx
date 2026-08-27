import { ColorPickerHelper } from '@/Components/Functions/ColorPickerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Picker Helper - DevOven',
  description: 'Convert any hex color to RGB, HSL, HSV, CMYK. Get complementary colors, shades, tints, and CSS variable declarations instantly.',
};

const page = () => <ColorPickerHelper />;
export default page;
