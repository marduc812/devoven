import { BandwidthCalculator } from '@/Components/Functions/BandwidthCalcTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/bandwidth', {
  title: 'Bandwidth Calculator | DevOven',
  description: 'Calculate file transfer time given file size and bandwidth. Supports KB/MB/GB/TB and Kbps/Mbps/Gbps. Includes common speed reference table.',
});

const page = () => <BandwidthCalculator />;
export default page;
