import { SequenceRecognizer } from '@/Components/Functions/SequenceRecognizerTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/sequence-recognizer', {
  title: 'Sequence Pattern Recognizer - DevOven',
  description: 'Identify the pattern in a number sequence: arithmetic, geometric, Fibonacci-like, perfect squares, triangular numbers, powers of 2, and polynomial progressions.',
});

const page = () => <SequenceRecognizer />;
export default page;
