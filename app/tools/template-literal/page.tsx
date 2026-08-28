import { TemplateLiteralEvaluator } from '@/Components/Functions/TemplateLiteralTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Template Literal Evaluator - DevOven',
  description: 'Safely evaluate JavaScript template literals with variable substitution. No eval — uses a safe arithmetic and string expression parser.',
}

const page = () => {
  return (
    <>
      <TemplateLiteralEvaluator />
    </>
  )
}

export default page
