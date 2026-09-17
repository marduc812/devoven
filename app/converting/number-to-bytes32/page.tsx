import { NumberToBytes32 } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-to-bytes32', {
    title: 'Online Number to Bytes32 Solidity Converter',
    description: 'Online Number to Bytes32 Solidity converter. Instant Number to Bytes32 conversion for Solidity smart contracts.'
  });

const page = () => {
    return (
       <NumberToBytes32 />
    )
}

export default page
