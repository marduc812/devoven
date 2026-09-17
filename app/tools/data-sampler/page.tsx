import { DataSampler } from '@/Components/Functions/DataSamplerTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/data-sampler', {
    title: 'Data Sampler / Shuffler - Random Sample, Shuffle, Train/Test Split',
    description: 'Perform random sampling, Fisher-Yates shuffle, train/test split, deduplication, and sorting on a list of items. One item per line input.',
});

const page = () => {
    return (
        <>
            <DataSampler />
        </>
    );
};

export default page;
