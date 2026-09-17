import { DecToHex } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/dec-to-hex', {
    title: 'Online Decimal to Hex Converter',
    description: 'Free online Decimal to Hexadecimal converter. Instant Decimal to Hex conversion.'
});

const page = () => {
    return (
        <DecToHex />
    )
}

export default page
