import { SequenceRecognizer } from '@/Components/Functions/SequenceRecognizerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sequence Pattern Recognizer - DevOven',
  description: 'Identify the pattern in a number sequence: arithmetic, geometric, Fibonacci-like, perfect squares, triangular numbers, powers of 2, and polynomial progressions.',
};

const page = () => <SequenceRecognizer />;
export default page;
