import { StringToBinary } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/string-to-binary', {
    title: 'Online String to Binary Converter',
    description: 'Online String to Binary converter. Instant String to Binary conversion.'
  });

const page = () => {
    return (
       <StringToBinary />
    )
}

export default page
