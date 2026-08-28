import { BoxShadowGenerator } from '@/Components/Functions/BoxShadowTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Box Shadow Generator - DevOven',
  description: 'Generate CSS box-shadow values from simple key=value config. Support multiple shadow layers separated by semicolons. Includes 10 preset shadow styles.',
};

const page = () => <BoxShadowGenerator />;
export default page;
