import { PangramChecker } from '@/Components/Functions/PangramTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/pangram', {
  title: 'Pangram Checker — Check for All 26 Letters | DevOven',
  description: 'Check if text is a pangram (contains all 26 letters). Shows missing letters, letter frequency, and isogram check.',
});

const page = () => {
  return (
    <>
      <PangramChecker />
    </>
  );
};

export default page;
