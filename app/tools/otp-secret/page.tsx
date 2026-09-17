import { OtpSecretTools } from '@/Components/Functions/OtpSecretTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/otp-secret', {
  title: 'OTP Secret Generator - DevOven',
  description: 'Generate secure TOTP-compatible base32 secret keys for two-factor authentication. Compatible with Google Authenticator, Authy, 1Password, and any RFC 6238 app.',
});

const page = () => <OtpSecretTools />;
export default page;
