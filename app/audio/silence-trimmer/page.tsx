import type { Metadata } from 'next';
import { SilenceTrimmer } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Silence Trimmer | DevOven",
  description: "Detect and remove silence from audio — leading and trailing dead air, or every gap.",
};

export default function Page() {
  return <SilenceTrimmer />;
}
