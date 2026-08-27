import { StringToBytes32 } from '@/Components/Functions/Encoders'
import type { Metadata } from 'next'

export const metadata = {
    title: 'Online String to Bytes32 Solidity Converter',
    description: 'Online String to Bytes32 Solidity converter. Instant String to Bytes32 conversion for Solidity smart contracts.'
  }

const page = () => {
    return (
       <StringToBytes32 />
    )
}

export default page
