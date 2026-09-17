import { DcfCalculator } from '@/Components/Functions/DcfCalcTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/dcf-calc', {
  title: 'DCF Calculator | DevOven',
  description: 'Compute Net Present Value (NPV) and Internal Rate of Return (IRR) for a series of cash flows using the discounted cash flow method.',
});

const page = () => <DcfCalculator />;
export default page;
