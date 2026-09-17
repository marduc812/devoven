import { Sm3 } from "@/Components/Functions/Sm3Tools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/sm3', {
    title: 'Online SM3 Hash Generator',
    description: 'Generate SM3 (GB/T 32905-2016) and HMAC-SM3 digests in your browser.'
});

const page = () => {
    return (
        <Sm3 />
    )
}

export default page
