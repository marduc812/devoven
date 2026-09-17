import { HexToRGB } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/converting/hex-to-rgb', {
  title: 'Online Hexadecimal to RGB Color Converter',
  description: 'Online Hexadecimal to RGB color converter. Convert hex color codes to RGB values for web designers and developers. Instant Hex to RGB conversion.'
});

const page = () => {
    return (
       <HexToRGB />
    )
}

export default page