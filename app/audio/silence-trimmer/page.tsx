import type { Metadata } from 'next';
import { SilenceTrimmer } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/silence-trimmer', {
  title: "Silence Trimmer | DevOven",
  description: "Detect and remove silence from audio — leading and trailing dead air, or every gap.",
});

export default function Page() {
  return <SilenceTrimmer />;
}
