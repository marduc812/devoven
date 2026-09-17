import { ArrayOps } from '@/Components/Functions/ArrayOpsTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/array-ops', {
  title: 'Array Operations - DevOven',
  description: 'Perform common operations on lists of values: sort, reverse, deduplicate, shuffle, filter, map, and slice. One item per line.',
});

const page = () => {
  return (
    <>
      <ArrayOps />
    </>
  )
}

export default page
