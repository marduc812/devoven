import { GradientGenerator } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Gradient Generator',
  description: 'Free online CSS linear gradient generator. Pick two colors and a direction to get a ready-to-use CSS gradient string.',
};

const page = () => <GradientGenerator />;
export default page;
