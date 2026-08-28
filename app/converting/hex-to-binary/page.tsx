import { HexToBinary } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online Hex to Binary Converter',
    description: 'Online Hex to Binary converter. Instant Hex to Binary conversion.'
  }

const page = () => {
    return (
       <HexToBinary />
    )
}

export default page
