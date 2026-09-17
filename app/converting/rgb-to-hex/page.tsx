import { RGBToHex } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/converting/rgb-to-hex', {
  title: 'Online RGB to Hex Color Converter',
  description: 'Online RGB to Hex color converter. Convert RGB values to hex color codes for web developers and designers. Instant RGB to Hex color conversion.'
});

const page = () => {
    return (
       <RGBToHex />
    )
}

export default page