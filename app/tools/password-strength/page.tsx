import { PasswordStrengthAnalyzer } from '@/Components/Functions/PasswordStrengthTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Strength Analyzer | DevOven',
  description: 'Analyze password strength in your browser. See entropy, character classes, and estimated crack times. Nothing is sent to any server.',
};

const page = () => <PasswordStrengthAnalyzer />;
export default page;
