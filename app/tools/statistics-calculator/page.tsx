import { StatisticsCalculator } from '@/Components/Functions/StatisticsTools'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Statistics Calculator - Mean, Median, Mode, Std Dev',
    description: 'Calculate descriptive statistics online. Enter numbers to get mean, median, mode, standard deviation, min, max, range, sum, and count instantly.',
}

const page = () => {
    return (
        <>
            <StatisticsCalculator />
        </>
    )
}

export default page
