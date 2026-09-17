import type { Metadata } from 'next';
import { StereoToMono } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/stereo-to-mono', {
  title: "Stereo to Mono | DevOven",
  description: "Fold stereo or multichannel audio down to a single mono track in your browser.",
});

export default function Page() {
  return <StereoToMono />;
}
