import { Md4 } from "@/Components/Functions/Md4Tools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/md4', {
    title: 'Online MD4 Hash Generator',
    description: 'Generate MD4 (RFC 1320) hashes in your browser. Used by NTLM, rsync, and eDonkey.'
});

const page = () => {
    return (
        <Md4 />
    )
}

export default page
