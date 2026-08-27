import { GitignoreGen } from '@/Components/Functions/GitignoreGenTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '.gitignore Generator - Generate .gitignore for Any Project',
    description: 'Generate .gitignore files for Node.js, Python, Java, Go, Rust, React, Next.js, Docker, Terraform, and more. Select templates and copy the combined output.',
}

const page = () => {
    return (
        <>
            <GitignoreGen />
        </>
    )
}

export default page
