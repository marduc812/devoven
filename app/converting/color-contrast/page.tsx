import { ColorContrastChecker } from '@/Components/Functions/ColorContrastTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Contrast Checker - DevOven',
  description: 'Check WCAG 2.1 color contrast ratio between two colors. See pass/fail for AA and AAA levels for normal and large text accessibility standards.',
};

const page = () => <ColorContrastChecker />;
export default page;
