import { RoiCalculator } from '@/Components/Functions/RoiCalcTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/roi-calc', {
  title: 'ROI Calculator | DevOven',
  description: 'Calculate return on investment (ROI), profit/loss, annualized ROI, and break-even analysis for any investment.',
});

const page = () => <RoiCalculator />;
export default page;
