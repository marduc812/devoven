import { Bytes32ToString } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/bytes32-to-string', {
    title: 'Online Bytes32 to String Solidity Converter',
    description: 'Online Bytes32 to String converter. Instant Bytes32 to String conversion.'
  });

const page = () => {
    return (
       <Bytes32ToString />
    )
}

export default page
