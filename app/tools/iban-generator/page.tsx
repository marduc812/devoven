import { IbanGeneratorTools } from '@/Components/Functions/IbanGeneratorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/iban-generator', {
  title: 'IBAN Generator - DevOven',
  description: 'Generate test IBANs for 42 countries with correct MOD-97 check digits. View a color-coded breakdown, copy results, or export TXT, CSV, and JSON locally.',
});

export default function Page() {
  return <IbanGeneratorTools />;
}
