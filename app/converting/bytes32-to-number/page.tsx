import { Bytes32ToNumber } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Online Solidity Bytes32 to Number Converter',
  description: 'Online Bytes32 to Number converter. Convert Bytes32 values to numbers for Solidity smart contract development. Instant Bytes32 to Number conversion.'
}

const page = () => {
    return (
       <Bytes32ToNumber />
    )
}

export default page
