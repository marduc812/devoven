import { CssSpecificityCalc } from '@/Components/Functions/CssSpecificityTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Specificity Calculator - DevOven',
  description: 'Calculate and compare the specificity of CSS selectors. See IDs, classes, and element counts at a glance.',
};

const page = () => <CssSpecificityCalc />;
export default page;
