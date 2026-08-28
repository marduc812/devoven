import { ExtractFromText } from '@/Components/Functions/SecurityTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Extract from Text - Extract Emails, URLs, IPs, Phones & Dates',
  description: 'Extract emails, URLs, IP addresses, phone numbers, dates, and credit card numbers from any block of text using regex pattern matching.',
}

const page = () => {
  return (
    <>
      <ExtractFromText />
    </>
  )
}

export default page
