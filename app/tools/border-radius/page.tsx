import { BorderRadiusGenerator } from '@/Components/Functions/DevTools4';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Border Radius Generator | DevOven',
  description: 'Generate complex CSS border-radius values with per-corner control. Supports px and % units with a live preview.',
};

const page = () => <BorderRadiusGenerator />;
export default page;
