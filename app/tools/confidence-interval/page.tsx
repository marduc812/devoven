import { ConfidenceInterval } from '@/Components/Functions/ConfidenceIntervalTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/confidence-interval', {
    title: 'Confidence Interval Calculator - t-Distribution, Margin of Error',
    description: 'Compute confidence intervals for a mean at 90%, 95%, or 99% confidence level. Uses t-distribution for small samples and z-score for large samples. Enter summary stats or raw data.',
});

const page = () => {
    return (
        <>
            <ConfidenceInterval />
        </>
    );
};

export default page;
