import type { Metadata } from 'next';
import { LoremGenerator } from '@/Components/Functions/LoremTools';

export const metadata: Metadata = {
  title: 'Lorem Ipsum Advanced Generator | DevOven',
  description: 'Generate placeholder text in multiple styles: Lorem Ipsum, Cicero Latin, Random English, Hipster, and Corporate Buzzwords. Choose words, sentences, or paragraphs.',
};

export default function Page() {
  return <LoremGenerator />;
}
