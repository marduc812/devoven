import { TimeDurationCalculator } from '@/Components/Functions/TimeDurationCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Duration Calculator - Parse, Convert, Add Durations',
  description: 'Parse and convert time durations such as 2h 30m, 1:30:00, 90 minutes or 1d 4h 30m 15s. Add or subtract a second duration and see the result in every unit.',
};

const page = () => <TimeDurationCalculator />;
export default page;
