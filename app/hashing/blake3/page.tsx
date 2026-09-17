import { Blake3 } from "@/Components/Functions/BlakeHashTools/Blake3"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/blake3', {
    title: 'Online BLAKE3 Hash Generator',
    description: 'Generate BLAKE3 hashes at any output length, including keyed and key-derivation modes, in your browser.'
});

const page = () => {
    return (
        <Blake3 />
    )
}

export default page
