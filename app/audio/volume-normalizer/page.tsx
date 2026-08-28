import type { Metadata } from 'next';
import { VolumeNormalizer } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Volume Normalizer | DevOven",
  description: "Peak-normalize audio to a target dBFS level in your browser. Shows the current peak and RMS.",
};

export default function Page() {
  return <VolumeNormalizer />;
}
