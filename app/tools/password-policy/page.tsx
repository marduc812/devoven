import { PasswordPolicy } from '@/Components/Functions/PasswordPolicyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Policy Checker | DevOven',
  description: 'Check a password against common security policy rules including length, character types, and patterns. All checks are done locally in your browser.',
};

const page = () => <PasswordPolicy />;
export default page;
