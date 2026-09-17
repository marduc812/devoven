import { HexToText } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-text', {
    title: 'Online Hex to Text Converter',
    description: 'Online Hex to Text converter. Instant Hex to Text conversion.'
  });

const page = () => {
    return (
       <HexToText />
    )
}

export default page
