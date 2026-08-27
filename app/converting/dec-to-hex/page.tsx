import { DecToHex } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Decimal to Hex Converter',
    description: 'Free online Decimal to Hexadecimal converter. Instant Decimal to Hex conversion.'
}

const page = () => {
    return (
        <DecToHex />
    )
}

export default page
