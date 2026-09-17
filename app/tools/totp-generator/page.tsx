import { TotpGenerator } from '@/Components/Functions/SecurityTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/totp-generator', {
  title: 'TOTP Generator - Time-Based One-Time Password Generator',
  description: 'Generate TOTP codes (RFC 6238) from a Base32 secret. Compatible with Google Authenticator and other TOTP apps.',
});

const page = () => {
  return (
    <>
      <TotpGenerator />
    </>
  )
}

export default page
