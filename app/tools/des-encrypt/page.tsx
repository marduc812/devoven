import { DesEncrypt } from '@/Components/Functions/DesTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DES Encrypt - Online DES Encryption Tool',
  description: 'Encrypt text with the DES algorithm using a password. All encryption happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <DesEncrypt />
    </>
  )
}

export default page
