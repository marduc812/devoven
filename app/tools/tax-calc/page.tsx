import type { Metadata } from 'next';
import { TaxCalculator } from '@/Components/Functions/TaxCalcTools';

export const metadata: Metadata = {
  title: 'VAT / Tax Calculator | DevOven',
  description: 'Calculate VAT and sales tax. Add tax to a net price or extract tax from a tax-inclusive amount. Includes common VAT rate reference for EU, US, and more.',
};

export default function Page() {
  return <TaxCalculator />;
}
