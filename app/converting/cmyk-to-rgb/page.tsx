import { CMYKToRGB } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online CMYK to RGB Color Converter',
    description: 'Online CMYK to RGB color converter. Convert CMYK values to RGB instantly. Instant CMYK to RGB color conversion.'
  }

const page = () => {
    return (
       <CMYKToRGB />
    )
}

export default page