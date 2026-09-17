import { HexToColorName } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-color-name', {
  title: 'HEX to CSS Color Name Converter',
  description: 'Free online HEX to CSS color name converter. Paste a hex code and find its CSS color name instantly. Instant HEX to CSS Color Name conversion.',
});

const page = () => <HexToColorName />;
export default page;
