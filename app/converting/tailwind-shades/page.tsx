import { TailwindShades } from '@/Components/Functions/TailwindShadesTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tailwind CSS Color Shades Generator | DevOven',
  description: 'Generate a full Tailwind-style color shade palette (50-950) from any hex color. Outputs CSS custom properties and a Tailwind config snippet.',
};

const page = () => <TailwindShades />;
export default page;
