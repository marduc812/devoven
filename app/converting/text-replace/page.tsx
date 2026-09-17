import { TextReplace } from "@/Components/Functions/Converters"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/text-replace', {
  title: 'Online Text Replace Tool - Find & Replace with Regex Support',
  description: 'Replace text or patterns in any string instantly in your browser. Supports plain text and regular expressions.'
});

const page = () => {
  return <TextReplace />
}

export default page
