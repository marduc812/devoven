import { Whirlpool } from "@/Components/Functions/WhirlpoolTools/index"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/whirlpool', {
    title: 'Online Whirlpool Hash Generator',
    description: 'Generate 512-bit Whirlpool (ISO/IEC 10118-3) hashes in your browser.'
});

const page = () => {
    return (
        <Whirlpool />
    )
}

export default page
