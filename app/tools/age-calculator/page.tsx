import { AgeCalculator } from '@/Components/Functions/AgeCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Age Calculator | DevOven',
  description: 'Calculate your exact age from a birthdate. Includes zodiac sign, day of week born, and days until next birthday.',
};

const page = () => <AgeCalculator />;
export default page;
