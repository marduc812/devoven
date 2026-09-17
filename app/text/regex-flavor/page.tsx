import { RegexFlavorConverter } from '@/Components/Functions/RegexFlavorTools'
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/regex-flavor', {
  title: 'Regex Flavor Converter - DevOven',
  description: 'Convert regex patterns between JavaScript, Python (re), PCRE, and POSIX ERE flavors. Handles named groups, backreferences, and compatibility notes. Instant Regex Flavor conversion.',
});

const page = () => {
  return (
    <>
      <RegexFlavorConverter />
    </>
  )
}

export default page
