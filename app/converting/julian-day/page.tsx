import { JulianDayCalculator } from '@/Components/Functions/JulianDayTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Julian Day Number | DevOven',
  description: 'Convert between Gregorian calendar dates and Julian Day Numbers (JDN) used in astronomy. Also computes Modified Julian Date (MJD), day of week, and Easter Sunday for any year.',
};

const page = () => <JulianDayCalculator />;
export default page;
