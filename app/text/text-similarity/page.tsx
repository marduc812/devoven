import { TextSimilarity } from '@/Components/Functions/TextSimilarityTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Similarity Score — Compare Two Texts with 5 Algorithms | DevOven',
  description: 'Compare two texts using Jaccard, Cosine, Edit Distance, LCS, and Bigram similarity. Separate texts with --- to get a full similarity analysis.',
};

const page = () => {
  return (
    <>
      <TextSimilarity />
    </>
  );
};

export default page;
