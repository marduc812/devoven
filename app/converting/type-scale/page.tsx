import { TypeScaleGenerator } from '@/Components/Functions/TypeScaleTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Type Scale Generator | DevOven',
  description: 'Generate a typographic scale with px, rem, and em values. Choose from presets like Minor Third, Perfect Fourth, or Golden Ratio. Outputs CSS custom properties.',
};

const page = () => <TypeScaleGenerator />;
export default page;
