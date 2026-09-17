import { BcryptInfo } from "@/Components/Functions/BcryptInfoTools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/bcrypt-info', {
    title: 'Bcrypt Hash Inspector — Parse Bcrypt Hash Structure',
    description: 'Parse a bcrypt hash to extract version, cost factor, salt, and hash components. Supports $2a, $2b, and $2y formats.'
});

const page = () => {
    return (
        <BcryptInfo />
    )
}

export default page
