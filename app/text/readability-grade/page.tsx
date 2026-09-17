import { ReadabilityGrade } from '@/Components/Functions/ReadabilityGradeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/readability-grade', {
  title: 'Readability Grade Level — 6 Metrics in One Tool | DevOven',
  description: 'Compute Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, SMOG Index, Coleman-Liau, and Automated Readability Index for any text.',
});

const page = () => {
  return (
    <>
      <ReadabilityGrade />
    </>
  );
};

export default page;
