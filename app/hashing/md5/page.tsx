import { MD5 } from "@/Components/Functions/Hashers/md5"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/md5', {
  title: 'Online MD5 Hashing',
  description: 'Best online JavaScript MD5 Hashing'
});

const page = () => {
  return (
      <MD5 />
  )
}

export default page