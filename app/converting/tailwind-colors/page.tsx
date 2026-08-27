import { TailwindColorTools } from '@/Components/Functions/TailwindColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tailwind Color Finder - DevOven',
  description: 'Find the closest Tailwind CSS v3 color to any hex value using Euclidean RGB distance. Returns the top 5 matches with ready-to-use class names.',
};

const page = () => <TailwindColorTools />;
export default page;
