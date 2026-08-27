import { HexToRGB } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Online Hexadecimal to RGB Color Converter',
  description: 'Online Hexadecimal to RGB color converter. Convert hex color codes to RGB values for web designers and developers. Instant Hex to RGB conversion.'
}


const page = () => {
    return (
       <HexToRGB />
    )
}

export default page