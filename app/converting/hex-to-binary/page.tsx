import { HexToBinary } from "@/Components/Functions/Encoders"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-binary', {
    title: 'Online Hex to Binary Converter',
    description: 'Online Hex to Binary converter. Instant Hex to Binary conversion.'
  });

const page = () => {
    return (
       <HexToBinary />
    )
}

export default page
