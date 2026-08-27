import type { Metadata } from 'next';
import { PassphraseStrength } from '@/Components/Functions/PassphraseStrengthTools';

export const metadata: Metadata = {
  title: 'Passphrase Strength & Policy Checker | DevOven',
  description: 'Check your password or passphrase against NIST SP 800-63B, PCI DSS 4.0, HIPAA, and OWASP ASVS requirements. See entropy, estimated crack times at multiple attack speeds, and improvement suggestions. All client-side.',
};

export default function Page() {
  return <PassphraseStrength />;
}
