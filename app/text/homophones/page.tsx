import { HomophoneChecker } from '@/Components/Functions/HomophoneTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Homophones & Confusables Checker — Detect Confused Word Pairs | DevOven',
  description: 'Find commonly confused word pairs in your text: their/there/they\'re, affect/effect, lose/loose, and 80+ more. Shows explanations for correct usage.',
};

const page = () => {
  return (
    <>
      <HomophoneChecker />
    </>
  );
};

export default page;
