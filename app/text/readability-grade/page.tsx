import { ReadabilityGrade } from '@/Components/Functions/ReadabilityGradeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Readability Grade Level — 6 Metrics in One Tool | DevOven',
  description: 'Compute Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, SMOG Index, Coleman-Liau, and Automated Readability Index for any text.',
};

const page = () => {
  return (
    <>
      <ReadabilityGrade />
    </>
  );
};

export default page;
