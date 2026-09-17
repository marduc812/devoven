import { NumberToColor } from '@/Components/Functions/NumberToColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-to-color', {
  title: 'Number to Color — Generate Deterministic Colors | DevOven',
  description: 'Generate a deterministic hex color from any number or string. Perfect for avatar colors from usernames.',
});

const page = () => {
  return (
    <>
      <NumberToColor />
    </>
  );
};

export default page;
