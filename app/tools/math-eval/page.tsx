import { MathEvaluator } from '@/Components/Functions/MathEvalTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safe Math Evaluator | DevOven',
  description: 'Evaluate math expressions safely without using eval(). Supports arithmetic, parentheses, and functions like sqrt, sin, cos, log. Enter one expression per line.',
};

const page = () => <MathEvaluator />;
export default page;
