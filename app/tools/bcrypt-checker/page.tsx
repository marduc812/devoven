import { BcryptChecker } from '@/Components/Functions/BcryptCheckerTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bcrypt Password Checker - Verify Password Against Hash',
  description: 'Verify a plaintext password against a bcrypt hash. All verification happens client-side in your browser.',
}

const page = () => {
  return (
    <>
      <BcryptChecker />
    </>
  )
}

export default page
