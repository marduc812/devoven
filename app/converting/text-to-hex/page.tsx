import { TextToHex } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online Text to Hex Converter',
    description: 'Online Text to Hex converter. Instant Text to Hex conversion.'
  }

const page = () => {
    return (
       <TextToHex />
    )
}

export default page
