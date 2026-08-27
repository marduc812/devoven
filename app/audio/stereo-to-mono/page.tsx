import type { Metadata } from 'next';
import { StereoToMono } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Stereo to Mono | DevOven",
  description: "Fold stereo or multichannel audio down to a single mono track in your browser.",
};

export default function Page() {
  return <StereoToMono />;
}
