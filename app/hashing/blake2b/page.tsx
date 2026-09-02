import { Blake2b } from "@/Components/Functions/BlakeHashTools/Blake2b"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online BLAKE2b Hash Generator',
    description: 'Generate BLAKE2b hashes from 128 to 512 bits, with optional keying, entirely in your browser.'
}

const page = () => {
    return (
        <Blake2b />
    )
}

export default page
