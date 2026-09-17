import { HexToDec } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-dec', {
    title: 'Online Hex to Decimal Converter',
    description: 'Free online Hexadecimal to Decimal converter. Instant Hex to Decimal conversion.'
});

const page = () => {
    return (
        <HexToDec />
    )
}

export default page
