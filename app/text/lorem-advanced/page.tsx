import type { Metadata } from 'next';
import { LoremGenerator } from '@/Components/Functions/LoremTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/lorem-advanced', {
  title: 'Lorem Ipsum Advanced Generator | DevOven',
  description: 'Generate placeholder text in multiple styles: Lorem Ipsum, Cicero Latin, Random English, Hipster, and Corporate Buzzwords. Choose words, sentences, or paragraphs.',
});

export default function Page() {
  return <LoremGenerator />;
}
