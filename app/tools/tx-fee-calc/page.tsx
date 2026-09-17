import type { Metadata } from 'next';
import { TxFeeCalculator } from '@/Components/Functions/TxFeeCalcTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/tx-fee-calc', {
  title: 'Transaction Fee Calculator | DevOven',
  description: 'Estimate Ethereum gas fees and Bitcoin transaction fees for common transaction types at various network speeds.',
});

const page = () => <TxFeeCalculator />;
export default page;
