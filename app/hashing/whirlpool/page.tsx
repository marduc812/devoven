import { Whirlpool } from "@/Components/Functions/WhirlpoolTools/index"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Whirlpool Hash Generator',
    description: 'Generate 512-bit Whirlpool (ISO/IEC 10118-3) hashes in your browser.'
}

const page = () => {
    return (
        <Whirlpool />
    )
}

export default page
