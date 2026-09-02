import { Pbkdf2 } from "@/Components/Functions/KdfTools/Pbkdf2"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online PBKDF2 Key Derivation',
    description: 'Derive keys with PBKDF2-HMAC-SHA1/256/384/512, with configurable salt and iteration count, in your browser.'
}

const page = () => {
    return (
        <Pbkdf2 />
    )
}

export default page
