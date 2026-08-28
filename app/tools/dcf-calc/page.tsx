import { DcfCalculator } from '@/Components/Functions/DcfCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DCF Calculator | DevOven',
  description: 'Compute Net Present Value (NPV) and Internal Rate of Return (IRR) for a series of cash flows using the discounted cash flow method.',
};

const page = () => <DcfCalculator />;
export default page;
