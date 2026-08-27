import { OctalToDec } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Online Octal to Decimal Converter',
    description: 'Free online Octal to Decimal converter. Instant Octal to Decimal conversion.'
}

const page = () => {
    return (
        <OctalToDec />
    )
}

export default page
