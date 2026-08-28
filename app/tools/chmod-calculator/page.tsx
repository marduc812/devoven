import { ChmodCalculator } from "@/Components/Functions/DevTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'chmod Calculator - Unix File Permission Calculator',
    description: 'Calculate Unix file permissions visually. Toggle read, write, execute for owner, group, and other. Get octal, symbolic notation, and chmod command.',
}

const page = () => {
    return (
        <>
            <ChmodCalculator />
        </>
    )
}

export default page
