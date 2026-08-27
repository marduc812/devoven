import { VcardGenerator } from '@/Components/Functions/VcardTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'vCard Generator — DevOven',
  description: 'Generate vCard 3.0 (.vcf) contact files from key=value input. Supports name, email, phone, org, title, url, address, and note fields. Also parses vCards back to structured display.',
};

const page = () => <VcardGenerator />;
export default page;
