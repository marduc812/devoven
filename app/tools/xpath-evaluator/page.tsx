import { XPathEvaluator } from '@/Components/Functions/MarkupQueryTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPath Evaluator & Tester',
  description:
    'Test XPath expressions against XML or HTML in your browser. Location paths, axes, predicates and the string and boolean functions, with the matches shown as text, markup or JSON.',
};

const page = () => <XPathEvaluator />;
export default page;
