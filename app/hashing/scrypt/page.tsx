import { Scrypt } from "@/Components/Functions/KdfTools/Scrypt"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online scrypt Key Derivation',
    description: 'Derive keys with scrypt (RFC 7914), with configurable N, r, and p cost parameters, in your browser.'
}

const page = () => {
    return (
        <Scrypt />
    )
}

export default page
