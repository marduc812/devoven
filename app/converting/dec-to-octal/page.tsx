import { DecToOctal } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/dec-to-octal', {
    title: 'Online Decimal to Octal Converter',
    description: 'Free online Decimal to Octal converter. Instant Decimal to Octal conversion.'
});

const page = () => {
    return (
        <DecToOctal />
    )
}

export default page
