import { TextToHex } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/text-to-hex', {
    title: 'Online Text to Hex Converter',
    description: 'Online Text to Hex converter. Instant Text to Hex conversion.'
  });

const page = () => {
    return (
       <TextToHex />
    )
}

export default page
