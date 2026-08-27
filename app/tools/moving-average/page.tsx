import { MovingAverage } from '@/Components/Functions/MovingAverageTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Moving Average Calculator - SMA, EMA, WMA',
    description: 'Compute Simple Moving Average (SMA), Exponential Moving Average (EMA), and Weighted Moving Average (WMA) for a series of numbers. Configure window size and type.',
};

const page = () => {
    return (
        <>
            <MovingAverage />
        </>
    );
};

export default page;
