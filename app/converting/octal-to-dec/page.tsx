import { OctalToDec } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/octal-to-dec', {
    title: 'Online Octal to Decimal Converter',
    description: 'Free online Octal to Decimal converter. Instant Octal to Decimal conversion.'
});

const page = () => {
    return (
        <OctalToDec />
    )
}

export default page
