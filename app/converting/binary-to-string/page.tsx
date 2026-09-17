import { BinaryToString } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/binary-to-string', {
    title: 'Online Binary to String Converter',
    description: 'Online Binary to String converter. Instant Binary to String conversion.'
  });

const page = () => {
    return (
       <BinaryToString />
    )
}

export default page
