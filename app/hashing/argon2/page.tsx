import { Argon2 } from "@/Components/Functions/KdfTools/Argon2"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/argon2', {
    title: 'Online Argon2 Password Hashing',
    description: 'Hash passwords with Argon2id, Argon2i, or Argon2d and get the PHC string, entirely in your browser.'
});

const page = () => {
    return (
        <Argon2 />
    )
}

export default page
