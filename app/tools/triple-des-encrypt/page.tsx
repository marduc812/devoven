import { TripleDesEncrypt } from '@/Components/Functions/TripleDesTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Triple DES Encrypt - Online 3DES Encryption Tool',
  description: 'Encrypt text with the Triple DES (3DES) algorithm using a password. All encryption happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <TripleDesEncrypt />
    </>
  )
}

export default page
