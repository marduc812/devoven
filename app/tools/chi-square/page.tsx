import { ChiSquareTest } from '@/Components/Functions/ChiSquareTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chi-Square Test - Goodness of Fit, p-Value Calculator',
    description: 'Compute the chi-square goodness-of-fit statistic for observed frequencies. Calculates chi-square (χ²), degrees of freedom, p-value, and hypothesis test decisions at α=0.05 and α=0.01.',
};

const page = () => {
    return (
        <>
            <ChiSquareTest />
        </>
    );
};

export default page;
