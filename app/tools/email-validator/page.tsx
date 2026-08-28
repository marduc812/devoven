import { EmailValidator } from '@/Components/Functions/EmailValidatorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Address Validator - DevOven',
  description: 'Validate email address format and extract components like local part, domain, and TLD. Detects disposable email providers.',
};

const page = () => <EmailValidator />;
export default page;
