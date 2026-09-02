import { Hkdf } from "@/Components/Functions/KdfTools/Hkdf"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online HKDF Key Derivation',
    description: 'Derive keys with HKDF (RFC 5869) using a salt and context info string, in your browser.'
}

const page = () => {
    return (
        <Hkdf />
    )
}

export default page
