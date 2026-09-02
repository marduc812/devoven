import { Blake2s } from "@/Components/Functions/BlakeHashTools/Blake2s"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online BLAKE2s Hash Generator',
    description: 'Generate BLAKE2s hashes from 128 to 256 bits, with optional keying, entirely in your browser.'
}

const page = () => {
    return (
        <Blake2s />
    )
}

export default page
