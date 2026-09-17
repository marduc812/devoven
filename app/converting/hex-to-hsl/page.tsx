import { HexToHsl } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-hsl', {
  title: 'Online HEX to HSL Color Converter',
  description: 'Free online HEX to HSL color converter. Paste a hex code and get HSL values instantly. Instant HEX to HSL Color conversion.',
});

const page = () => <HexToHsl />;
export default page;
