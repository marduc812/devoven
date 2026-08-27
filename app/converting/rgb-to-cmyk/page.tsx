import { RGBToCMYK } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online RGB to CMYK Converter',
    description: 'Online RGB to CMYK converter. Instant RGB to CMYK color conversion.'
  }

const page = () => {
    return (
       <RGBToCMYK />
    )
}

export default page