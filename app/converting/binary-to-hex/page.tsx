import { BinaryToHex } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online Binary to Hex Converter',
    description: 'Online Binary to Hex converter. Instant Binary to Hex conversion.'
  }

const page = () => {
    return (
       <BinaryToHex />
    )
}

export default page
