import type { Metadata } from 'next';
import { VolumeNormalizer } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/volume-normalizer', {
  title: "Volume Normalizer | DevOven",
  description: "Peak-normalize audio to a target dBFS level in your browser. Shows the current peak and RMS.",
});

export default function Page() {
  return <VolumeNormalizer />;
}
