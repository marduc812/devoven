import { MD5 } from "@/Components/Functions/Hashers/md5"
import type { Metadata } from 'next'

export const metadata = {
  title: 'Online MD5 Hashing',
  description: 'Best online JavaScript MD5 Hashing'
}

const page = () => {
  return (
      <MD5 />
  )
}

export default page