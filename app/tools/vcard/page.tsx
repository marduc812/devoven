import { VcardGenerator } from '@/Components/Functions/VcardTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'vCard Generator — DevOven',
  description: 'Build a vCard 3.0 (.vcf) contact file and a scannable QR code from a simple form: name, organization, job title, email, phone, website, address, and note. Download the .vcf or the QR code, pre-fill fields from the URL, or paste an existing vCard to edit it.',
};

const page = () => <VcardGenerator />;
export default page;
