import { ChmodCalculator } from "@/Components/Functions/DevTools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/chmod-calculator', {
    title: 'chmod Calculator - Unix File Permission Calculator',
    description: 'Calculate Unix file permissions visually. Toggle read, write, execute for owner, group, and other. Get octal, symbolic notation, and chmod command.',
});

const page = () => {
    return (
        <>
            <ChmodCalculator />
        </>
    )
}

export default page
