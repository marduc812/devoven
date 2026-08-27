import { RoiCalculator } from '@/Components/Functions/RoiCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ROI Calculator | DevOven',
  description: 'Calculate return on investment (ROI), profit/loss, annualized ROI, and break-even analysis for any investment.',
};

const page = () => <RoiCalculator />;
export default page;
