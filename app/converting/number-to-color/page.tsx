import { NumberToColor } from '@/Components/Functions/NumberToColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Number to Color — Generate Deterministic Colors | DevOven',
  description: 'Generate a deterministic hex color from any number or string. Perfect for avatar colors from usernames.',
};

const page = () => {
  return (
    <>
      <NumberToColor />
    </>
  );
};

export default page;
