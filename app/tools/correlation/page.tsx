import { CorrelationCalculator } from '@/Components/Functions/CorrelationTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/correlation', {
    title: 'Correlation Coefficient Calculator - Pearson r, Spearman ρ, Regression',
    description: 'Compute Pearson correlation coefficient (r), r² (coefficient of determination), Spearman rank correlation, and linear regression slope/intercept for two data series.',
});

const page = () => {
    return (
        <>
            <CorrelationCalculator />
        </>
    );
};

export default page;
