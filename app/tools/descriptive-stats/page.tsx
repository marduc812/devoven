import { DescriptiveStatsCalculator } from '@/Components/Functions/DescriptiveStatsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Descriptive Statistics Calculator - Mean, Median, Std Dev, Percentiles',
    description: 'Enter a list of numbers to compute descriptive statistics: count, sum, mean, median, mode, range, variance, standard deviation, min, max, and percentiles (25th, 75th, 90th, 95th).',
};

const page = () => {
    return (
        <>
            <DescriptiveStatsCalculator />
        </>
    );
};

export default page;
