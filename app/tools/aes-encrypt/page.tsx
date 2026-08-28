import { AesEncrypt } from '@/Components/Functions/SecurityTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AES Encrypt - Online AES-256-GCM Encryption Tool',
  description: 'Encrypt text with AES-256-GCM using a password-derived key (PBKDF2). All encryption happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <AesEncrypt />
    </>
  )
}

export default page
