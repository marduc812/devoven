import { TailwindShades } from '@/Components/Functions/TailwindShadesTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/tailwind-shades', {
  title: 'Tailwind CSS Color Shades Generator | DevOven',
  description: 'Generate a full Tailwind-style color shade palette (50-950) from any hex color. Outputs CSS custom properties and a Tailwind config snippet.',
});

const page = () => <TailwindShades />;
export default page;
