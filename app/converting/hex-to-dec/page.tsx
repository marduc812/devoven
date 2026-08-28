import { HexToDec } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Hex to Decimal Converter',
    description: 'Free online Hexadecimal to Decimal converter. Instant Hex to Decimal conversion.'
}

const page = () => {
    return (
        <HexToDec />
    )
}

export default page
