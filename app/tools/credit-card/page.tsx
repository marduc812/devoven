import { CreditCardTools } from '@/Components/Functions/CreditCardTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Validator - DevOven',
  description: 'Validate credit card numbers using the Luhn algorithm. Detects Visa, Mastercard, American Express, Discover, JCB, and Diners Club.',
};

const page = () => <CreditCardTools />;
export default page;
