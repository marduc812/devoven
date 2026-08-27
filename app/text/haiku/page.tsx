import { HaikuValidator } from '@/Components/Functions/HaikuTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haiku Validator — Check 5-7-5 Syllable Pattern | DevOven',
  description: 'Validate if your poem follows the haiku 5-7-5 syllable pattern. Shows per-line counts and suggestions. Also generates haiku from a theme word.',
};

const page = () => {
  return (
    <>
      <HaikuValidator />
    </>
  );
};

export default page;
