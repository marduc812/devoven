import { HexToText } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online Hex to Text Converter',
    description: 'Online Hex to Text converter. Instant Hex to Text conversion.'
  }

const page = () => {
    return (
       <HexToText />
    )
}

export default page
