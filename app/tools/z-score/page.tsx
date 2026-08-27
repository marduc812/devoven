import { ZScoreCalculator } from '@/Components/Functions/ZScoreTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Z-Score Calculator - Normal Distribution, Percentile Rank',
    description: 'Compute Z-score from value, mean, and standard deviation. Displays percentile rank, P(X < value), P(X > value) using the normal distribution.',
};

const page = () => {
    return (
        <>
            <ZScoreCalculator />
        </>
    );
};

export default page;
