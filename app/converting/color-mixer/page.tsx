import { ColorMixerTools } from '@/Components/Functions/ColorMixerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Mixer - DevOven',
  description: 'Mix two colors together with an adjustable ratio. See the blended result in HEX and RGB, plus a 5-stop gradient scale.',
};

const page = () => <ColorMixerTools />;
export default page;
