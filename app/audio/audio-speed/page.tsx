import type { Metadata } from 'next';
import { AudioSpeed } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/audio-speed', {
  title: "Audio Speed Changer | DevOven",
  description: "Speed up or slow down audio in your browser. Resamples, so pitch moves with the speed.",
});

export default function Page() {
  return <AudioSpeed />;
}
