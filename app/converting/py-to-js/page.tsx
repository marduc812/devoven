import { PyToJs } from '@/Components/Functions/PyToJsTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Python to JS Syntax Converter - DevOven',
  description: 'Convert Python syntax patterns to JavaScript equivalents. Handles print, def, elif, True/False/None, f-strings, list comprehensions, and more. Instant Python to JS Syntax conversion.',
}

const page = () => {
  return (
    <>
      <PyToJs />
    </>
  )
}

export default page
